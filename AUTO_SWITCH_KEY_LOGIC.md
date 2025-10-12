# Auto-Switch Key Logic

## Tổng quan

Đã thêm logic auto-switch key để tự động chuyển sang key khác khi key hiện tại fail.

## Luồng hoạt động

### 1. Key Selection Strategy

- Sắp xếp keys theo quota còn lại (cao nhất trước)
- Loại bỏ keys đã có lỗi generation
- Ưu tiên keys có quota cao nhất

### 2. Error Handling Logic

#### Voice Errors (Không retry)

- `"was not found"` - Voice không tồn tại
- Dừng ngay lập tức, không thử key khác

#### Auth Errors (Skip key)

- `"Invalid API Key"` hoặc `"401"`
- Đánh dấu key có lỗi, thử key tiếp theo

#### Quota Errors (Skip key)

- `"character_limit_reached"`, `"quota"`, `"limit"`
- Đánh dấu key có lỗi, thử key tiếp theo

#### Other Errors (Retry with next key)

- Các lỗi khác (network, server, etc.)
- Thử key tiếp theo

### 3. Console Logging

```
Trying key: 12345678...
Key 12345678... failed: Character limit reached
Key 12345678... quota exceeded, trying next key
Trying key: 87654321...
Success with key: 87654321...
```

### 4. Error Messages

- Hiển thị số lượng keys đã thử: `"All API keys failed (Tried 3 keys)"`
- Giúp user hiểu hệ thống đã cố gắng retry

## Lợi ích

### ✅ Trước khi có auto-switch

- 1 key fail → toàn bộ generation fail
- Không tận dụng được keys khác
- User phải manual retry

### ✅ Sau khi có auto-switch

- Tự động thử tất cả keys có sẵn
- Tận dụng tối đa quota từ nhiều keys
- User experience tốt hơn
- Giảm thiểu manual intervention

## Code Changes

### Key Changes in `generateAndTrackHistory`:

1. **Thay thế worker pool logic** bằng `generateWithAutoSwitch`
2. **Thêm error classification** để xử lý từng loại lỗi khác nhau
3. **Cải thiện logging** để debug dễ dàng
4. **Smart key selection** dựa trên quota còn lại

### Error Recovery Flow:

```
Key 1 → Fail (quota) → Try Key 2
Key 2 → Fail (auth) → Try Key 3
Key 3 → Success → Complete
```

## Testing Scenarios

### Scenario 1: Key 1 hết quota

- Key 1: quota = 0 → Skip
- Key 2: quota = 1000 → Success

### Scenario 2: Key 1 invalid, Key 2 success

- Key 1: Invalid API Key → Skip
- Key 2: Valid → Success

### Scenario 3: All keys fail

- Key 1: Network error → Try next
- Key 2: Server error → Try next
- Key 3: Quota exceeded → All failed

### Scenario 4: Voice error (no retry)

- Key 1: Voice not found → Stop immediately
- Không thử keys khác vì lỗi voice
