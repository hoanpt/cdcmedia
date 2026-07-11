# Hướng Dẫn Sử Dụng Tính Năng Mới - Hệ Thống CDC Media

Tài liệu này tổng hợp lại các tính năng mới nhất vừa được phát triển và tích hợp thành công vào hệ thống.

## 1. Trợ Lý Trí Tuệ Nhân Tạo (Google Gemini AI)
Hệ thống đã được tích hợp Google Gemini AI để tự động đọc hiểu các tài liệu và viết ra đoạn mô tả ngắn gọn, chuyên nghiệp. Tính năng này hỗ trợ đọc chữ từ các định dạng file: **PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx)**.

### Cách cấu hình (Dành cho Admin)
- Để AI hoạt động, hệ thống cần được cấp quyền thông qua `Gemini API Key`.
- **Bước 1:** Đăng nhập vào [Google AI Studio](https://aistudio.google.com/). Bấm nút **"Get API Key"** và tạo một khoá bảo mật. (Việc này hoàn toàn miễn phí và mỗi tháng Google cấp cho bạn một lượng yêu cầu rất lớn, dùng tẹt ga).
- **Bước 2:** Quay lại Hệ thống CDC Media, đăng nhập bằng tài khoản Admin.
- **Bước 3:** Vào mục **Cài đặt chung (Biểu tượng Bánh răng)** > Cuộn xuống phần **Cấu hình Trí tuệ Nhân tạo**.
- **Bước 4:** Dán mã Key vừa lấy vào ô `Gemini API Key` và bấm **Lưu cài đặt**.

### Cách sử dụng Tự động tạo mô tả khi Upload
- Mỗi khi bạn tải lên một file tài liệu mới ở trang Dashboard, bạn sẽ thấy ô checkbox **✨ Tự động tạo bằng AI** nằm ngay cạnh ô nhập Mô tả tài liệu.
- Chỉ cần tick vào ô này, hệ thống sẽ tự động bóc tách chữ trong file và nhờ Gemini viết một đoạn mô tả dài 2-4 câu, điền vào ô mô tả sau khi upload hoàn tất.

### Cách xử lý hàng loạt tài liệu cũ chưa có mô tả
Nếu bạn có hàng chục tài liệu cũ đang bị trống phần mô tả, hãy làm như sau:
1. Vào mục **Tài liệu của bạn** (hoặc Tất cả tài liệu với Admin).
2. Tích chọn (check) vào các file mà bạn muốn thêm mô tả.
3. Khi bạn chọn từ 1 file trở lên, một thanh công cụ màu xanh sẽ hiện lên. Bấm vào nút **✨ Tạo mô tả (AI)**.
4. Chờ hệ thống chạy ngầm. Hệ thống sẽ lần lượt bóc tách nội dung của từng file đã chọn (Kể cả file đang lưu trên Google Drive), gửi cho AI tóm tắt và tự động cập nhật vào cơ sở dữ liệu.

---

## 2. Quản Lý Phân Hệ & Lọc Tài Liệu Nhanh
Để dễ dàng quản lý hàng nghìn tài liệu, hệ thống đã trang bị bộ lọc theo "Chuyên đề lớn" (Phân hệ).

### Phân hệ là gì?
- Thay vì chỉ có các Chuyên mục nhỏ, các chuyên mục giờ đây được nhóm vào các **Phân hệ (Group)**. Ví dụ: Phân hệ *Video*, *Infographic*, *Tài liệu chuyên môn*.
- Bạn có thể chỉnh sửa/tạo mới các Phân hệ này trong Tab **Phân hệ** của trang Quản trị Admin.

### Lọc tài liệu theo Phân hệ
- Tại trang danh sách Tài liệu (Dashboard), ngay cạnh nút làm mới sẽ có ô chọn **Bộ lọc Phân hệ**.
- Khi bạn chọn "Video", hệ thống chỉ liệt kê các tài liệu nằm trong tất cả các chuyên mục thuộc phân hệ Video.
- Tính năng này rất tuyệt vời khi kết hợp với công cụ **Chuyển nhanh (Bulk Move)**: Lọc ra một nhóm tài liệu -> Tick chọn hàng loạt -> Di chuyển chúng sang chuyên mục khác chỉ với 2 click.

---

## 3. Tối ưu Giao diện Trang Chủ (Public UI)
- **Hiển thị Mô tả:** Trên trang chủ, phần hiển thị thẻ (Tags) bên dưới mỗi tài liệu đã được gỡ bỏ. Thay vào đó, đoạn mô tả (do bạn viết hoặc AI tự động tạo) sẽ được hiển thị ngay bên dưới Tiêu đề của tài liệu (tối đa 2 dòng). Giúp giao diện gọn gàng, người xem dễ đọc và dễ nắm bắt nội dung hơn mà không cần click vào xem chi tiết.
- **Biểu tượng trực quan:** Các thanh Menu ngang của Phân hệ ngoài trang chủ hiện đã được hỗ trợ gắn các biểu tượng icon (như Video, Loa, Hình ảnh,...) để tạo cảm giác hiện đại và bắt mắt.

---

> _Tài liệu được xuất tự động bởi AI Assistant._
