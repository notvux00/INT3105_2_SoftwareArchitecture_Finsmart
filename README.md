#  Finsmart — Personal Finance Management System

> **Bài tập lớn môn Kiến trúc phần mềm – INT3105 2**  
> **Đề tài:** Cải tiến hệ thống quản lý tài chính cá nhân.
---

## 👥 Nhóm 18
- **Nguyễn Trung Hiếu - 23020664**
- **Đào Hồng Lĩnh - 23021613**
- **Nguyễn Anh Tuấn - 23021707**
- **Lê Duy Vũ - 23021751**

---

## 📌 Bản gốc
- GitHub Repository: https://github.com/natuan05/FinSmartProject-FSD

---

## 🧩 Chức năng chính của bản gốc

Hệ thống Finsmart bao gồm:
- Ghi và tra cứu lịch sử thu chi.
- Thêm hạn mức chi tiêu.
- Thêm và quản lý các giao dịch định kì.
- Thống kê chi tiêu cá nhân bằng biểu đồ.
- Thiết lập các danh mục tiết kiệm.

---

# 🚀 Các cải tiến & tính năng mới

## **1. Nguyễn Trung Hiếu**

---

# A. Testing & CI/CD cho FinSmart

### **1. Vấn đề (Problem)**
- **Thiếu kiểm thử tự động:** Trước khi cải tiến, hệ thống gần như không có test tự động. Khi sửa code frontend, các bạn phải tự mở app, click từng màn hình (Login, Giao dịch, Định kỳ, Tiết kiệm, …) để kiểm tra → dễ sót lỗi, khó lặp lại.
- **CI/CD chưa kiểm soát được chất lượng thay đổi:** Nếu một commit làm hỏng luồng nghiệp vụ quan trọng (ví dụ tạo giao dịch, thống kê, tiết kiệm), lỗi chỉ được phát hiện khi chạy demo hoặc khi người dùng phàn nàn.
- **Phụ thuộc vào Supabase thật khi test:** Các luồng đăng ký/đăng nhập, tạo giao dịch, gọi Edge Functions… đang phụ thuộc trực tiếp vào Supabase. Nếu mạng chậm, Supabase lỗi tạm thời, hoặc dữ liệu bị thay đổi → test tay dễ cho kết quả không ổn định, khó tái hiện.

### **2. Giải pháp (Solution)**
- **Bổ sung lớp kiểm thử End-to-End bằng Cypress:** Xây dựng các kịch bản E2E mô phỏng luồng người dùng thật:
  - Đăng ký & đăng nhập (Authentication).
  - Tạo giao dịch và xem thống kê (Transaction & Statistic).
  - Quản lý giao dịch định kỳ (Preodic).
  - Quản lý mục tiêu tiết kiệm (Economical).
- **Tích hợp kiểm thử vào CI pipeline trên GitHub Actions:** Mỗi lần push/pull request, pipeline sẽ tự động:
  - Cài đặt Node + dependency.
  - Build ứng dụng React.
  - Chạy npm run test:ci.
  - Chạy toàn bộ test E2E bằng Cypress (npm run e2e): Nếu bất kỳ bước nào fail → job dừng, commit bị đánh dấu đỏ, giúp phát hiện lỗi sớm.
- **Mock các API Supabase trong E2E test:** 
  - Sử dụng ```cy.intercept()``` để giả lập response từ Edge Functions và REST API của Supabase.
  - Giúp test chạy ổn định, không phụ thuộc mạng hay trạng thái database thật; đồng thời dễ tạo các kịch bản dữ liệu “đẹp” để demo.

### **3. Kết quả (Result)**
- **Kết quả chạy cục bộ:** 
  - ```npm run test:ci``` hiện chưa có file Jest test nên log “No tests found, exiting with code 0”, tuy nhiên exit code = 0 nên được coi là thành công.
  - **Đây sẽ là chỗ cho hình ảnh**
  - ```npm run e2e``` chạy 4 spec (auth, finance-flows, preodic, economical) với tổng 8 test, 8 passed, 0 failed (screenshot đính kèm).
  - **Đây sẽ là chỗ cho hình ảnh**
- **Lợi ích đạt được:**
  - Mỗi lần push code, GitHub Actions tự động build và chạy lại toàn bộ kịch bản E2E cho các luồng quan trọng nhất của FinSmart.
  - Nếu một thay đổi làm hỏng luồng đăng nhập, tạo giao dịch, định kỳ hoặc tiết kiệm, pipeline sẽ fail ngay trên GitHub, giúp nhóm phát hiện và sửa lỗi sớm.
  - Việc sử dụng ```cy.intercept()``` để mock Supabase giúp test ổn định, không bị phụ thuộc vào dữ liệu thật hoặc tình trạng của dịch vụ bên ngoài.

---

## **2. Đào Hồng Lĩnh**

---

# A. API Gateway (API Third Party Proxy)

### **1. Vấn đề (Problem)**
- **Lộ Key bảo mật:** Khi Client (Frontend) gọi trực tiếp đến các dịch vụ thứ 3 (như Database, AI Service, Payment Gateway), chúng ta buộc phải lưu API Key hoặc Token ở phía Client. Hacker có thể dễ dàng mở Network Tab của trình duyệt để lấy trộm các Key này.
- **Thiếu kiểm soát truy cập:** Không thể chặn hoặc lọc các yêu cầu từ Client gửi đi nếu gọi trực tiếp từ Frontend, không kiểm soát được ai đang gọi API, tần suất bao nhiêu, có thể spam gây ảnh hưởng tới hệ thống, cụ thể hơn là tốn token.

### **2. Giải pháp (Solution)**
- Chuyển đổi từ mô hình **Client** → **Third Party** sang mô hình **Client** → **Proxy (Server)** → **Third Party**.
- Xây dựng **API Proxy** sử dụng **Supabase Edge Functions (Deno)**.
- Tất cả các Key nhạy cảm (```SERVICE_KEY```, ```REDIS_TOKEN```, ```GEMINI_API_KEY```) được lưu trữ an toàn trong **biến môi trường** (Environment Variables) tại Server, tuyệt đối không lộ ra Frontend.
- Client chỉ gọi đến Proxy của hệ thống, Proxy sẽ xử lý nốt việc gọi tiếp đến dịch vụ thứ 3, tất cả những biến nhạy cảm đều không để bị lộ.

### **3. Tình huống cụ thể (Example)**
- **Nếu KHÔNG có Proxy:** 
  - Frontend gọi trực tiếp đến Gemini, sử dụng các biến nhạy cảm ở ```.env```. Chúng ta phải nhúng ```SECRET_KEY``` vào code JavaScript ở Frontend.
  - **Hậu quả:** Hacker mở **F12 (DevTools)**, vào tab **Network**, nhìn thấy ngay **Authorization: Bearer sk-12345abcxyz....** Họ copy key này, về nhà viết tool riêng khai thác tài nguyên sử dụng key này, ví dụ như API của gemini, từ đó có thể gây ra thiệt hại và ảnh hưởng tới hệ thống.
- **Khi CÓ Proxy:**
  - Client chỉ gọi POST /api/… về server của mình.
  - **Server (Supabase Edge Function)** giữ ```SECRET_KEY``` trong biến môi trường bí mật. Server tự mình gọi tới, mọi thao tác xử lý sẽ nằm ở Edge Function, nó sẽ tự lấy các biến hoặc tự gọi tới mô hình gemini để lấy dữ liệu.
  - **Kết quả:** Client không bao giờ chạm được vào Key, không thể nào biết key để có thể lợi dụng.

---

# B. Rate Limiting

### **1. Vấn đề (Problem)**
- **Tấn công dò mật khẩu (Brute-Force & Credential Stuffing):** 
  - Kẻ tấn công sử dụng công cụ tự động để thử hàng nghìn tổ hợp mật khẩu khác nhau vào một tài khoản trong thời gian ngắn.
  - **Hậu quả**: Gây quá tải hệ thống xác thực và nguy cơ bị lộ tài khoản người dùng.
- **Cạn kiệt tài nguyên (Resource Exhaustion/Spam):**
  - Bot hoặc Script độc hại thực hiện đăng ký tài khoản hàng loạt.
  - **Hậu quả**: Làm đầy Database với dữ liệu rác, tiêu tốn tài nguyên tính toán (CPU/RAM) cho việc mã hóa mật khẩu (Hashing), và khai thác tính năng đăng ký để kiểm tra sự tồn tại của người dùng (User Enumeration).
- **Lạm dụng từ nội bộ (Authenticated Abuse):** Ngay cả khi đã đăng nhập thành công, một tài khoản bị chiếm quyền (hoặc người dùng xấu) có thể spam request API để tấn công hệ thống từ bên trong (Internal DDoS).
- **Thách thức hạ tầng mạng (NAT Challenge):** Trong thực tế, nhiều người dùng (ví dụ: trường học, quán Cafe) chia sẻ chung một địa chỉ IP Public thông qua cơ chế NAT. Việc chặn IP đơn thuần sẽ dẫn đến chặn nhầm người dùng hợp lệ.

### **2. Giải pháp (Solution)**
- **Chiến lược bảo vệ Đăng nhập (2-Phase Defense):**
  - **Lớp 1 - Global IP Limit:** Giới hạn tổng số request từ 1 IP (Ví dụ: 100 req/5 phút). Mục tiêu: Chống Spam/DDoS diện rộng.
  - **Lớp 2 - Targeted User Limit:** Giới hạn số lần thử sai trên 1 tài khoản cụ thể (Ví dụ: 5 req/3 phút). Mục tiêu: Chống dò mật khẩu (Brute-force) vào mục tiêu cụ thể mà không ảnh hưởng đến người dùng khác cùng IP.
  - 2 lớp này có thể phủ được nhiều trường hợp, bao gồm trường hợp phổ biến nhất là người dùng quên mật khẩu, nhập lại nhiều lần nhưng không ảnh hưởng đến mọi người trong phòng, có thời gian reset hợp lí, đồng thời chống DDOS khi hacker muốn xâm nhập hệ thống.
- **Chiến lược bảo vệ Đăng ký (Write Protection):** Mỗi lần push/pull request, pipeline sẽ tự động:
  - **Global IP Limit:** Giới hạn nghiêm ngặt số lượng tài khoản được tạo từ 1 IP trong khoảng thời gian ngắn. Ngăn chặn việc làm rác Database, không reset khi người dùng đăng ký thành công.
- **Chiến lược bảo vệ sau đăng nhập (Internal Traffic Control):** 
  - Áp dụng giới hạn cho các API nội bộ (như /rl-check) ở mức 50 req/phút cho mỗi User ID. Đảm bảo hacker không thể dùng tài khoản hợp lệ để làm tê liệt hệ thống.

### **3. Tình huống cụ thể (Example)**
- **Chính sách "No-Reset on Success":** 
  - **Cơ chế:** Bộ đếm Rate Limit sẽ không được reset về 0 ngay cả khi người dùng đăng nhập hoặc đăng ký thành công.
  - **Lý do bảo mật:** Để chống lại kỹ thuật "Gaming the System". Kẻ tấn công có thể thử 4 lần sai, sau đó thực hiện 1 lần đúng (hoặc login vào tài khoản rác) để reset bộ đếm, rồi lại tiếp tục tấn công. Việc giữ nguyên bộ đếm giúp duy trì áp lực bảo mật liên tục trong khung thời gian (Window).
  - **Trade-off:** Chấp nhận rủi ro nhỏ về trải nghiệm người dùng (UX) để đổi lấy sự an toàn tuyệt đối cho hệ thống.
- **Thuật toán Fixed Window (Cửa sổ cố định)**
  - Hệ thống sử dụng cơ chế đếm trên các key Redis Upstash có TTL.
  - **Ưu điểm:** Fixed Window có hiệu suất cao, là lựa chọn tuyệt vời cho các giới hạn tốc độ cơ bản và các ứng dụng có lưu lượng truy cập lớn cần tiết kiệm tài nguyên, hiệu năng cực cao, độ trễ thấp và chi phí triển khai trên Edge Functions rẻ hơn so với thuật toán Sliding Window Log phức tạp.
  - **Nhược điểm:** Trong khoảng thời gian cực ngắn (chỉ 1 giây, từ 00:59 đến 01:00.1), Server của bạn phải xử lý 10 request thay vì giới hạn 5 request. Nếu có hàng nghìn kẻ tấn công làm điều này đồng thời, toàn bộ hệ thống sẽ bị quá tải (Spike) ngay tại thời điểm chuyển giao cửa sổ (Window boundary), dẫn đến tình trạng treo máy hoặc chậm phản hồi, tức là hacker phải căn được thời điểm hoàn hảo để tấn công, tuy nhiên thực tế sẽ không đơn giản do tính không đồng bộ của mạng và đồng bộ hóa các Botnet trong thời gian tính bằng ms.
- **Kết quả đạt được:**
  - **Chặn đứng tấn công Brute-force & Spam:** Hệ thống tự động trả về lỗi 429 Too Many Requests khi vượt quá giới hạn.
  - **Tối ưu hiệu năng & Giảm tải Database:** Toàn bộ việc kiểm tra diễn ra tại Edge (Redis), request rác bị chặn ngay từ cổng, không làm tốn tài nguyên Database xử lý. Độ trễ cực thấp nhờ thuật toán Fixed Window (độ phức tạp O(1)).
  - **Giải quyết vấn đề NAT (Trải nghiệm người dùng):** Nhờ cơ chế Targeted User Limit, hệ thống chỉ khóa tài khoản đang bị tấn công, không khóa toàn bộ IP. Người dùng khác dùng chung Wifi (như quán Cafe) vẫn truy cập bình thường.
  - **Ngăn chặn lạm dụng nội bộ:** Ngay cả user đã đăng nhập cũng bị giới hạn tần suất gọi API (ví dụ: ```rl-check```), ngăn chặn việc dùng tài khoản hợp lệ để DDoS hệ thống từ bên trong.

---

# C. Retry Pattern

### **1. Vấn đề (Problem)**
- **Khả năng sẵn sàng kém (Poor Availability):** Hệ thống không thể xử lý các lỗi mạng chập chờn, lỗi timeout hoặc lỗi 5xx tạm thời (Transient Failures) mà Server dễ gặp phải trong môi trường Cloud.
  - **Lỗi ở Tầng Ứng dụng (Application Layer):** Các vấn đề về cache dữ liệu, lỗi mount component tạm thời, hoặc lỗi fetching dữ liệu nhanh từ phía Client.
  - **Lỗi ở Tầng Mạng/Dịch vụ (Network/Service Layer):** Các lỗi do dịch vụ Backend hoặc dịch vụ bên thứ ba (Third Party API) bị quá tải, gây ra lỗi 503 (Service Unavailable) hoặc Timeout.
- **Thundering Herd:** Nếu tất cả các Client thử lại cùng một lúc sau một lỗi đồng bộ, chúng sẽ tạo ra một làn sóng (Retry Storm) request khổng lồ, khiến Server đang yếu lại bị quá tải nặng hơn và sập hoàn toàn.

### **2. Giải pháp (Solution)**
 **Thuật toán Exponential Backoff và Jitter được triển khai theo Chiến lược Đa Lớp (Multi-layered Strategy) để tối ưu khả năng phục hồi ở từng tầng kiến trúc:**

 #### **a. Triển khai Lớp 1: Tầng Ứng dụng (Application Layer - React)**
Lớp này tập trung vào việc cải thiện trải nghiệm người dùng (UX) và xử lý các lỗi tức thời, không cần can thiệp sâu của Server.
- **Cơ chế:** Sử dụng thư viện quản lý trạng thái và fetching dữ liệu (React Query) để tự động xử lý request thất bại.
- **Cấu hình:** Đặt retry: 1
- **Mục tiêu:**
  - Xử lý lỗi mạng rất nhỏ, cục bộ xảy ra giữa thiết bị người dùng và Edge Function.
  - Tăng Trải nghiệm Người dùng (UX) bằng cách tự động thử lại nhanh chóng, không làm gián đoạn giao diện.

 #### **b. Triển khai Lớp 2: Tầng API (Network/HTTP Request - Edge Function)**
Lớp này tập trung vào bảo vệ hệ thống và ngăn chặn Retry Storm khi gọi các dịch vụ Backend/Bên thứ ba.
- **Cơ chế:** Hàm ```retryWrapper``` tùy chỉnh, được áp dụng cho mọi lời gọi HTTP request quan trọng trong Edge Function.
- **Logic Thử lại:**
  - Thử lại Lũy thừa (Backoff): Độ trễ chờ tăng theo cấp số mũ ( 2^i) cho phép Backend có thời gian phục hồi.
  - Thêm Nhiễu Ngẫu nhiên (Jitter): Chọn độ trễ thực tế (actualDelay) ngẫu nhiên trong khoảng đã tính toán. Mục tiêu là phá vỡ sự đồng bộ.
  - **Hạn chế:** Giới hạn số lần thử lại (maxRetries = 3) và thời gian chờ tối đa (maxDelayMs = 10000ms).
- **Mục tiêu:** Bảo vệ bệ thống khỏiretry storm, và đảm bảo tính nguyên tử của giao dịch khi tương tác với các dịch vụ bên ngoài.

### **3. Kết quả (Result)**
- Hệ thống khắc phục được những lúc gặp sự cố tạm thời nhờ cơ chế phân tầng:
  - Nếu React Cache có vấn đề hoặc lỗi kết nối Client-Side nhỏ, Lớp 1 sẽ xử lý bằng một lần retry nhanh chóng, không ảnh hưởng tới back-end hay trải nghiệm người dùng.
  - Nếu Tầng Network/Backend có vấn đề (ví dụ: Server bên thứ ba như Gemini gặp sự cố tạm thời 503), Lớp 2 (Edge Function) sẽ kích hoạt Backoff và Jitter. Lớp 2 sẽ dàn đều các yêu cầu thử lại theo thời gian. Điều này ngăn chặn làn sóng request đồng bộ đâm vào Server, cho phép Server có thời gian tự phục hồi, và đảm bảo tính sẵn sàng (Availability) của dịch vụ được duy trì.

---

## **3. Nguyễn Anh Tuấn**

---

# A. Cache-Aside Pattern (Client-Side Caching)

### **1. Vấn đề (Problem)**
- **Cache mất khi refresh page:** React Query chỉ cache trong memory (RAM), mỗi lần người dùng refresh page (F5) hoặc close/reopen browser, cache bị xóa hoàn toàn. Hậu quả: phải load lại toàn bộ data từ server mỗi lần refresh (~660ms), user experience kém, cảm giác app "chậm và lặp lại".
- **API calls trùng lặp không cần thiết:** Mỗi lần refresh = 5-10 API calls được gọi lại dù data chưa thay đổi. Hậu quả: tốn 1.2 MB bandwidth mỗi lần, server bị spam requests (100K users/day = 350K duplicate calls/day).
- **Navigate chậm khi memory cache expire:** Sau 10 phút không tương tác, memory cache bị garbage collected. Hậu quả: khi user navigate lại giữa các trang → phải fetch API từ đầu (500ms) thay vì instant (5-10ms), trải nghiệm bị gián đoạn.


### **2. Giải pháp (Solution)**
- Từ **React Query (Memory Cache only)** sang **React Query + localStorage Persistence** → **Cache persist** qua refresh/close browser.
- **localStorage Persistence Layer:** Sử dụng ```@tanstack/react-query-persist-client``` để serialize cache từ memory xuống localStorage của browser. Cache key: ```FINSMART_QUERY_CACHE```, auto-sync mỗi khi data thay đổi, TTL 24 giờ (tự động expire).
- Hệ thống kiểm tra dữ liệu theo thứ tự tốc độ: **Memory** → **localStorage** → **API**. Chỉ gọi Server khi cache L1 và L2 đều không khả dụng.

### **3. Kết quả (Result)**
- Sau khi chạy lần đầu tiên, khi mà F5 lại trang thì tốc độ tải trang được cải thiện đáng kể (gần như ngay lập tức).
- **Test Environment:** Chrome 120, Desktop, Navigation mode, Default network (no throttling).
  - **Đây là chỗ cho hình ảnh**

---

# B. Health Endpoint Monitoring Pattern

### **1. Vấn đề (Problem)**
- **Silent Failures:** Khi backend gặp sự cố, người dùng chỉ phát hiện khi thực hiện thao tác (thêm giao dịch, xem thống kê). Hậu quả: trải nghiệm người dùng tệ, không biết lỗi do mạng hay hệ thống.
- **Phát hiện lỗi chậm:** Admin/Dev không biết server down cho đến khi nhận được khiếu nại từ user. Hậu quả: downtime kéo dài, mất uy tín, không thể phản ứng kịp thời.
- **Network Timeout mơ hồ:** Request timeout (5-10 giây) nhưng không rõ nguyên nhân (server chết, mạng chậm, database quá tải). Hậu quả: người dùng hoang mang, không biết nên retry hay chờ đợi.

### **2. Giải pháp (Solution)**
- **Health Check Endpoint:** Tạo Supabase Edge Function đơn giản trả về ```{ status: "online", timestamp, message: "System Operational" }``` khi server còn sống. Response time bình thường ~100-300ms, timeout sau 5 giây nếu không phản hồi.
- **Automated Polling (30 giây/lần):** Frontend tự động gọi health endpoint mỗi 30 giây bằng React Query với cấu hình ```refetchInterval: 30000, retry: false```. Không retry để phát hiện downtime nhanh nhất (lỗi → báo đỏ ngay).
- **Hiển thị SystemStatus component ở Sidebar với 3 trạng thái màu sắc trực quan:**
  - **Xanh lá** (online): Hệ thống ổn định
  - **Đỏ** (offline): Mất kết nối server
  - **Cam** (loading): Đang kiểm tra...
- **Timeout Protection:** Client tự động abort request sau 5 giây bằng AbortController. Nếu server không phản hồi trong 5s → đánh dấu offline ngay, tránh blocking UI khi network chậm.

### **3. Tình huống cụ thể (Example)**
- **Phát hiện downtime ngay lập tức:** Server Supabase bị restart hoặc deploy Edge Function mới → Health endpoint timeout hoặc trả HTTP 500 → Frontend nhận biết ngay sau 5 giây (timeout threshold) → Chuyển trạng thái sang 🔴 Mất kết nối tự động → User nhìn thấy indicator đỏ, biết hệ thống đang gặp sự cố thay vì lỗi mạng cá nhân → Tránh được việc user bấm retry nhiều lần gây duplicate requests.
- **Giám sát tự động 24/7:** Hệ thống tự động ping server mỗi 30 giây (2,880 requests/ngày) để kiểm tra tình trạng hoạt động. Nếu phát hiện downtime, admin có thể can thiệp ngay lập tức thay vì chờ user khiếu nại. Trong quá trình vận hành thực tế, pattern này giúp phát hiện được các sự cố network ngắn hạn (1-2 phút) mà người dùng có thể không nhận ra.
- **Cải thiện UX khi có sự cố:** Khi hệ thống offline, thay vì hiển thị lỗi mơ hồ **"Failed to fetch"** hay spinning loader mãi không dứt, user thấy ngay thông báo rõ ràng **"Mất kết nối"** với indicator đỏ. Điều này giúp user hiểu tình hình và quyết định đợi thay vì liên tục refresh trang hoặc spam button **"Xác nhận"**.
- **Đây là chỗ cho hình ảnh**

---

## **4. Lê Duy Vũ**

---

# A. Saga Pattern

### **1. Vấn đề (Problem)**
- **Giao dịch trùng lặp:** Khi người dùng bấm nút "Thêm giao dịch" nhiều lần do mạng chậm hoặc UI không phản hồi, hệ thống tạo nhiều giao dịch giống nhau.
  - **Hậu quả:** Người dùng bị trừ tiền nhiều lần (ví dụ: bấm 3 lần → trừ 15,000đ thay vì 5,000đ), dữ liệu báo cáo không chính xác.
- **Tranh chấp dữ liệu:** Nhiều requests đồng thời cập nhật cùng một ví/hạn mức mà không có cơ chế khóa.
  - **Hậu quả:** Số dư ví không chính xác, vượt hạn mức chi tiêu mà không bị chặn, data inconsistency nghiêm trọng.
- **Không có Rollback Mechansim:** Mỗi bước (tạo transaction, trừ ví, cập nhật limit) được thực hiện độc lập. Nếu bước giữa chừng fail, các bước trước đó không được hoàn tác.
  - **Hậu quả:** Transaction được tạo nhưng ví không bị trừ tiền (hoặc ngược lại), dữ liệu không khớp giữa các bảng.
- **Timeout và Network Failures:** Khi request timeout hoặc mất mạng giữa chừng, client không biết server đã xử lý thành công hay chưa. 
  - **Hậu quả:** Người dùng bấm retry tạo duplicate transaction, hoặc không dám bấm lại dẫn đến mất giao dịch.

### **2. Giải pháp (Solution)**
- Chuyển từ mô hình **Client** → **Database** trực tiếp sang **Client** → **Edge Function** → **Database**.
- Client sinh ```idempotency_key``` duy nhất (UUID) cho mỗi request. Edge Function kiểm tra Redis trước khi xử lý - nếu key đã tồn tại thì trả về kết quả ``cached`` (exactly-once semantics), nếu chưa có thì xử lý và cache kết quả. Cache TTL: 24 giờ (success), 5 phút (error).
- Xây dựng stored ```procedures update_wallet_atomic()``` và ```update_limit_atomic()``` để đảm bảo tính nguyên tử. Database tự động lock row khi update, transaction-level rollback tự động nếu constraint vi phạm.
- **SAGA Workflow:** Tạo transaction record trong DB → Gọi RPC atomic, fail nếu số dư không đủ → Gọi RPC atomic, fail nếu vượt hạn mức → Lưu kết quả vào Redis. Nếu bước 2 hoặc 3 fail thì xóa transaction record (bước 1), cache error vào Redis (TTL 5 phút), trả lỗi cho client.
- Request timeout 5 giây (lần đầu), 10 giây (retry). Tự động retry khi timeout với CÙNG ```idempotency_key```. Hiển thị toast notification: **warning khi retry, success/error khi hoàn tất**.

### **3. Tình huống cụ thể (Example)**
- **Chống trùng lặp (Idempotency):** Xử lý triệt để lỗi double-click và duplicate do mạng lag.
- **Chặn Race Condition:** Đảm bảo số dư chính xác tuyệt đối khi có nhiều người dùng đồng thời.
- **Rollback tự động:** Bảo vệ dữ liệu khi server crash hoặc vi phạm hạn mức/số dư.
- **High Availability:** Hỗ trợ Auto-retry và Fallback khi Redis hoặc mạng gặp sự cố.
- **Đây là chỗ cho hình ảnh**

---

# B. CQRS Pattern (SQL View của Supabase)

### **1. Vấn đề (Problem)**
- **Query phức tạp gây chậm:** Trang thống kê cần **JOIN** nhiều bảng (transactions, income, wallets, users) với **GROUP BY, SUM, aggregate functions**. Mỗi lần load trang phải thực thi lại query phức tạp này, mất 2-5 giây với dữ liệu lớn (hàng nghìn transactions).
- **Multiple JOINs không hiệu quả:** Để hiển thị "Chi tiêu theo danh mục", phải **JOIN** transactions + wallets + users, filter theo user_id, **GROUP BY** category, **SUM** amount. Query này chạy mỗi khi user mở trang hoặc thay đổi filter, tốn rất nhiều database resources.
- **Aggregate computation overhead:** Tính toán "Thu chi theo tháng" yêu cầu **GROUP BY** tháng/năm, **SUM** cho cả transactions (chi) và income (thu), sau đó merge results. Logic phức tạp này được lặp lại mỗi request, không có caching.


### **2. Giải pháp (Solution)**
- **Tách Command và Query (CQRS):** **Query operations** (đọc dữ liệu thống kê) được tối ưu riêng bằng **Views**, không ảnh hưởng đến Command side (write operations như tạo/sửa/xóa transactions). Database tự động maintain Views, không cần code phức tạp.
- **Supabase Views** là ***computed on-the-fly*** (non-materialized by default) nên data luôn fresh. Khi có transaction mới, View tự động reflect changes ở lần query tiếp theo. Không cần manual refresh.
- **Frontend chỉ query Views:** ```statisticRepository.js``` gọi trực tiếp ```from('view_expenses_by_category')``` và ```from('view_monthly_stats')``` thay vì raw complex queries. Code đơn giản hơn, dễ maintain, fast response.

### **3. Kết quả (Result)**
- **Database Query:** Loại bỏ hoàn toàn Complex JOINs, chỉ sử dụng Simple SELECT giúp code đơn giản hơn
- **Code Maintenance:** Giảm 80% lượng code logic phức tạp ở Frontend.
- **System Health:** Chuyển trạng thái Database từ High Load sang Low Load.
- **Khi thực hiện truy vấn để thống kê lịch sử chi tiêu của user:**
- **Đây là chỗ cho hình ảnh**

---

# C. Asynchronous Request-Reply Pattern (Xây dựng giao dịch bất đồng bộ)

### **1. Vấn đề (Problem)**
- **Xử lý realtime không hiệu quả:** Nếu xử lý giao dịch định kỳ ngay khi user tạo (synchronous), hệ thống phải check liên tục xem đến hạn chưa, tốn tài nguyên server và database connection. Nếu có 1000 giao dịch định kỳ, phải query liên tục 1000 lần mỗi phút.
- **Blocking UI:** User phải đợi server xử lý xong mới nhận được response. Nếu xử lý phức tạp (check số dư, trừ ví, ghi log, tính ngày tiếp theo), user sẽ thấy UI bị "đơ" trong vài giây.
- **Không scalable:** Khi số lượng giao dịch định kỳ tăng lên (hàng nghìn, hàng chục nghìn), việc check realtime cho từng transaction sẽ làm quá tải hệ thống. Mỗi user request sẽ chậm dần do phải xử lý quá nhiều logic.
- **Thiếu tính ổn định:** Nếu xử lý ngay lập tức mà có lỗi (mất mạng, database down), user sẽ thấy error ngay. Không có cơ chế retry hoặc xử lý sau khi hệ thống ổn định.


### **2. Giải pháp (Solution)**
- User tạo giao dịch định kỳ → Chỉ lưu vào database (fast, non-blocking). Việc thực thi giao dịch (trừ tiền, ghi log) được xử lý sau bởi background job.
- **Sử dụng Cron Job + Edge Function:** Supabase Cron Job tự động gọi Edge Function process-periodic-transactions theo schedule (ví dụ: mỗi 3 phút). Edge Function sẽ batch process tất cả giao dịch đến hạn trong 1 lần chạy.
- **Batch Processing:** Edge Function **SELECT** tất cả periodic tasks đã đến hạn ```(next_execution <= now)```, xử lý tuần tự từng task (check số dư → trừ ví → ghi log → update next_execution). Hiệu quả hơn xử lý từng cái một khi user request.
- **Bảo mật với CRON_SECRET:** Edge Function chỉ chấp nhận request từ **Cron Job** (kiểm tra ```Authorization: Bearer ${CRON_SECRET```}). Ngăn chặn unauthorized access từ client hoặc attacker.
- **Auto-disable khi thất bại:** Nếu số dư không đủ, task tự động bị tạm dừng ```(is_active = false)```. Nếu hết hạn ```(endDate < now)```, task cũng bị disable. Tránh xử lý vô ích và thông báo lỗi cho user.

### **3. Tình huống cụ thể (Example)**
- **Xử lý cao tải:** Chuyển đổi sang xử lý bất đồng bộ theo lô giúp giảm độ trễ phản hồi xuống và loại bỏ hoàn toàn nút thắt cổ chai khi có hàng nghìn giao dịch cùng thời điểm.
- **Cơ chế tự phục hồi:** Tích hợp chiến lược Auto-Retry giúp hệ thống "miễn nhiễm" với các sự cố hạ tầng tạm thời (mạng lag, DB timeout), đảm bảo không mất dữ liệu.
- **Toàn vẹn nghiệp vụ:** Cron Job thực hiện cơ chế Pre-check (kiểm tra trước số dư, hạn mức) nghiêm ngặt; tự động vô hiệu hóa (Disable) các tác vụ không hợp lệ để bảo vệ dữ liệu tài chính.
- **Đây là chỗ cho hình ảnh**

---

##  Công nghệ sử dụng

- **Frontend:** React 19, React Router v7, TanStack Query (React Query), Chart.js / Recharts (Biểu đồ).
- **Backend:** Supabase (Edge Functions), Python (Xử lý AI/Logic phụ trợ).
- **Database:** Supabase (PostgreSQL).
- **Authentication:** Supabase Auth, Bcrypt / Crypto-js.
- **Testing:** Cypress (E2E), React Testing Library, Locust
- **CI/CD:** GitHub Actions.

---

##  Cài đặt & chạy dự án

**1.Yêu cầu tiên quyết:** Đảm bảo đã cài đặt Node.js
```bash
# 1. Clone dự án về máy
git clone <repo-link>

# 2. Di chuyển vào thư mục dự án
cd INT3105_2_SoftwareArchitecture_Finsmart

# 3. Cài đặt các thư viện (Dependencies)
npm install
```

**2.Cấu hình môi trường**
```bash
# Tạo file .env và điền các thông tin sau:
REACT_APP_SECRET_KEY= ...
REACT_APP_SUPABASE_URL= ...
REACT_APP_SUPABASE_KEY= ...
REACT_APP_SUPABASE_ANON_KEY= ...
```

**3.Chạy ứng dụng**
```bash
# Chạy ứng dụng ở chế độ phát triển (Development)
# Ứng dụng sẽ mở tại http://localhost:3000
npm start
```
**4.Kiểm thử**
```bash
# Chạy toàn bộ test
npm test

# Chạy Cypress (E2E Testing)
npm run cy:run
```