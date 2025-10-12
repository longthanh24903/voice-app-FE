# 🔄 Workflow Cập nhật - Import & Split Text

## 📋 Tổng quan

Đã cập nhật workflow để phù hợp với yêu cầu: **Import file sẽ đưa tất cả nội dung vào textarea của task hiện tại**, sau đó sử dụng chức năng "Chia văn bản" để tạo nhiều task.

## ✨ Workflow mới

### **1. Import File (.txt)**

- **Hành vi cũ**: Tạo nhiều task từ mỗi dòng trong file
- **Hành vi mới**: Import tất cả nội dung vào task hiện tại
- **Lợi ích**: Kiểm soát tốt hơn, có thể chỉnh sửa trước khi chia

### **2. Chia văn bản**

- Nhập số từ trong 1 task (mặc định: 100)
- Nhấn "Chia văn bản" để tạo nhiều task
- Mỗi task chứa đúng số từ đã chỉ định

### **3. Generate All**

- Sử dụng "Generate All" để tạo tất cả audio
- Hoặc tạo từng task riêng lẻ

## 🎯 Cách sử dụng mới

### **Bước 1: Import File**

1. Mở ứng dụng
2. Nhấn nút import file (📁)
3. Chọn file .txt
4. **Tất cả nội dung sẽ xuất hiện trong textarea**

### **Bước 2: Chia văn bản (tùy chọn)**

1. Nhập số từ muốn trong 1 task
2. Nhấn "Chia văn bản"
3. Văn bản sẽ được chia thành nhiều task

### **Bước 3: Tạo giọng nói**

1. Sử dụng "Generate" cho task hiện tại
2. Hoặc "Generate All" cho tất cả tasks

## 📊 So sánh Workflow

### **Workflow cũ:**

```
File .txt → Tạo nhiều task → Generate All
```

### **Workflow mới:**

```
File .txt → Import vào task hiện tại → [Chia văn bản] → Generate All
```

## 🎨 UI/UX Cải tiến

### **1. Import Button**

- **Tooltip cũ**: "Import tasks from .txt file (one task per line)"
- **Tooltip mới**: "Import text from .txt file into current task"

### **2. Split Text Controls**

- Chỉ hiển thị khi có văn bản trong textarea
- Input validation cho số từ
- Button state rõ ràng

### **3. Task Management**

- Import không tạo task mới
- Chia văn bản mới tạo nhiều task
- Dễ dàng quản lý và chỉnh sửa

## 🔧 Technical Changes

### **Files Modified**

- `App.tsx`: Cập nhật `handleImportTasksFromFile()`
- `translations.ts`: Cập nhật tooltip cho import

### **Logic Changes**

```javascript
// Cũ: Tạo nhiều task từ mỗi dòng
const newTasks = lines.map((line) => ({ id: Date.now(), text: line }));

// Mới: Cập nhật task hiện tại
setTasks((prev) =>
  prev.map((task) =>
    task.id === activeTaskId ? { ...task, text: trimmedContent } : task
  )
);
```

## 🎯 Use Cases

### **1. Audiobook Creation**

1. Import file chương sách
2. Chia thành các đoạn nhỏ (100-200 từ)
3. Tạo giọng nói cho từng đoạn

### **2. Content Creation**

1. Import bài viết dài
2. Chia thành các phần (50-150 từ)
3. Tạo podcast từ nội dung

### **3. Educational Content**

1. Import tài liệu học tập
2. Chia thành các chủ đề
3. Tạo audio cho từng phần

## 🚀 Lợi ích

### **1. Kiểm soát tốt hơn**

- Xem toàn bộ nội dung trước khi chia
- Chỉnh sửa nội dung nếu cần
- Quyết định có chia hay không

### **2. Linh hoạt hơn**

- Import có thể dùng cho 1 task
- Chia văn bản là tùy chọn
- Workflow đơn giản hơn

### **3. Hiệu quả cao**

- Ít click hơn
- Workflow trực quan
- Dễ hiểu và sử dụng

---

**🎉 Workflow đã được cập nhật!**

Người dùng có thể import file vào task hiện tại, sau đó sử dụng chức năng "Chia văn bản" để tạo nhiều task một cách linh hoạt và hiệu quả.
