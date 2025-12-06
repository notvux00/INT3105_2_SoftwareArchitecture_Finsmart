import requests
import uuid
import concurrent.futures
import time
import json

# ================= CẤU HÌNH (BẠN ĐIỀN THÔNG TIN VÀO ĐÂY) =================
# 1. URL của Edge Function (Lấy trong Supabase Dashboard -> Edge Functions)
API_URL = "https://nvbdupcoynrzkrwyhrjc.supabase.co/functions/v1/create-transaction-saga"

# 2. Key ẩn danh (Anon Key) hoặc Service Role Key (Lấy trong Project Settings -> API)
AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YmR1cGNveW5yemtyd3locmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzM4MzYsImV4cCI6MjA3NTUwOTgzNn0.sT0IzHQWrIcNkVKmKeeUpwPATkcCYmRL2whrC0g-c60"

# 3. Thông tin User và Ví để test (Lấy ID thật trong Database của bạn)
USER_ID = 10        # Thay bằng ID user có thật
WALLET_ID = 4     # Thay bằng ID ví có thật (Hãy set số dư ví này là 10,000 để test)
AMOUNT = 1000      # Số tiền trừ mỗi lần
# =========================================================================

headers = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json"
}

def send_transaction_request(thread_index, idempotency_key=None):
    # Nếu không truyền key (test race condition), tạo key mới cho mỗi request
    key = idempotency_key if idempotency_key else str(uuid.uuid4())
    
    payload = {
        "user_id": USER_ID,
        "wallet_id": WALLET_ID,
        "amount": AMOUNT,
        "type": "chi",
        "category": "Test Saga",
        "date": "2024-03-20",
        "note": f"Stress Test {thread_index}",
        "idempotency_key": key
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        return f"Thread {thread_index}: Code {response.status_code} | Msg: {response.text}"
    except Exception as e:
        return f"Thread {thread_index}: Lỗi kết nối - {str(e)}"

def test_race_condition():
    print("\n========== TEST 1: RACE CONDITION (TRANH CHẤP DỮ LIỆU) ==========")
    print(f"Kịch bản: 5 requests cùng trừ {AMOUNT}đ. Ví chỉ nên bị trừ đúng số lần hợp lệ.")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # Gửi 5 request đồng thời, mỗi request có key khác nhau (coi như 5 lần click)
        futures = [executor.submit(send_transaction_request, i) for i in range(1, 6)]
        
        for future in concurrent.futures.as_completed(futures):
            print(future.result())

def test_idempotency():
    print("\n========== TEST 2: IDEMPOTENCY (CHỐNG TRÙNG LẶP) ==========")
    print("Kịch bản: Gửi CÙNG 1 request (cùng key) 2 lần liên tiếp.")
    
    test_key = str(uuid.uuid4()) # Key cố định cho bài test này
    
    print("--- Gửi lần 1 (Phải thành công) ---")
    print(send_transaction_request(1, test_key))
    
    print("--- Đợi 1 giây... ---")
    time.sleep(1)
    
    print("--- Gửi lần 2 (Phải trả về kết quả Cached, KHÔNG trừ tiền thêm) ---")
    print(send_transaction_request(2, test_key))

def test_rollback():
    print("\n========== TEST 3: ROLLBACK KHI THẤT BẠI (SỐ DƯ KHÔNG ĐỦ) ==========")
    print("Kịch bản: Trừ số tiền LỚN HƠN số dư ví → SAGA phải rollback transaction.")
    
    # Tạo payload với số tiền rất lớn để trigger insufficient balance
    payload = {
        "user_id": USER_ID,
        "wallet_id": WALLET_ID,
        "amount": 999999999,  # Số tiền cực lớn, chắc chắn vượt quá số dư
        "type": "chi",
        "category": "Test Rollback",
        "date": "2024-03-20",
        "note": "Testing SAGA Rollback",
        "idempotency_key": str(uuid.uuid4())
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        result = response.json()
        
        print(f"Response Code: {response.status_code}")
        print(f"Response Body: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if response.status_code == 400 and not result.get("success"):
            print("\n✅ ROLLBACK THÀNH CÔNG: Giao dịch bị từ chối và đã rollback!")
            print(f"   Lỗi nhận được: {result.get('error')}")
        else:
            print("\n❌ BẤT THƯỜNG: Request thành công khi không nên thành công!")
            
    except Exception as e:
        print(f"Lỗi kết nối: {str(e)}")

def test_network_recovery():
    print("\n========== TEST 4: KHÔI PHỤC SAU KHI MẤT MẠNG (RETRY) ==========")
    print("Kịch bản: Gửi request → Giả lập timeout → Retry với CÙNG key.")
    
    recovery_key = str(uuid.uuid4())  # Dùng key cố định cho cả 2 lần gửi
    
    payload = {
        "user_id": USER_ID,
        "wallet_id": WALLET_ID,
        "amount": AMOUNT,
        "type": "chi",
        "category": "Test Network Recovery",
        "date": "2024-03-20",
        "note": "Testing retry after network failure",
        "idempotency_key": recovery_key
    }
    
    print("\n--- Lần 1: Gửi request (giả sử TIMEOUT, client không nhận được response) ---")
    try:
        # Gửi với timeout cực ngắn để simulate network failure
        response1 = requests.post(API_URL, headers=headers, json=payload, timeout=0.01)
        result1 = response1.json()
        print(f"Lần 1: Code {response1.status_code} | ID: {result1.get('id')}")
    except requests.exceptions.Timeout:
        print("⚠️ TIMEOUT! Client không nhận được response (giả lập mất mạng)")
    except Exception as e:
        print(f"⚠️ Client đã timeout hoặc mất kết nối: {type(e).__name__}")
    
    print("\n--- Đợi 2 giây (giả sử server đã xử lý xong trong background)... ---")
    time.sleep(2)
    
    print("\n--- Lần 2: RETRY với CÙNG idempotency_key (sau khi mạng đã ổn) ---")
    try:
        response2 = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        result2 = response2.json()
        
        print(f"Lần 2: Code {response2.status_code}")
        print(f"Response: {json.dumps(result2, indent=2, ensure_ascii=False)}")
        
        if result2.get("success"):
            print(f"\n✅ KHÔI PHỤC THÀNH CÔNG!")
            print(f"   Transaction ID: {result2.get('id')}")
            print(f"   💡 Nhờ idempotency_key, client có thể retry an toàn mà không tạo giao dịch trùng!")
        else:
            print(f"\n⚠️ Giao dịch thất bại: {result2.get('error')}")
            
    except Exception as e:
        print(f"❌ Retry cũng thất bại: {str(e)}")

if __name__ == "__main__":
    # Chạy lần lượt 4 bài test
    test_race_condition()
    test_idempotency()
    test_rollback()
    test_network_recovery()