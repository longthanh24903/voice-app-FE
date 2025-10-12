# Pagination Width & Text Wrapping Fixes

## Tổng quan

Đã fix vấn đề width bé và text wrapping trong pagination controls để tạo ra layout gọn gàng và professional hơn.

## Vấn đề đã fix

### 1. **Button Width Issues**

- ❌ **Trước**: Buttons bị squeeze, text bị wrap
- ❌ **Trước**: Icons và text không có proper spacing
- ❌ **Trước**: Action buttons bị cramp trên mobile

### 2. **Text Wrapping Issues**

- ❌ **Trước**: Text trong buttons bị wrap xuống dòng
- ❌ **Trước**: Page numbers bị squeeze
- ❌ **Trước**: Records info bị overflow

### 3. **Layout Issues**

- ❌ **Trước**: Pagination controls không có proper width constraints
- ❌ **Trước**: Responsive layout không tối ưu
- ❌ **Trước**: Elements bị overlap hoặc squeeze

## Cải tiến chính

### 1. **Container Layout Fixes**

#### **Main Container**

```css
/* Trước */
<div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">

/* Sau */
<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 min-w-0">
```

**Benefits:**

- ✅ **Better breakpoint**: lg thay vì xl cho responsive
- ✅ **Width control**: min-w-0 để control overflow
- ✅ **Flexible layout**: Better space distribution

#### **Left Section**

```css
/* Trước */
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">

/* Sau */
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 min-w-0">
```

**Benefits:**

- ✅ **Overflow control**: min-w-0 để prevent overflow
- ✅ **Flexible content**: Content có thể shrink khi cần
- ✅ **Better spacing**: Consistent gap-3

### 2. **Action Buttons Fixes**

#### **Button Container**

```css
/* Trước */
<div className="flex flex-wrap items-center gap-2">

/* Sau */
<div className="flex flex-wrap items-center gap-2 min-w-0">
```

#### **Button Styling**

```css
/* Trước */
<button className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150 shadow-sm">

/* Sau */
<button className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150 shadow-sm whitespace-nowrap flex-shrink-0">
  <DownloadIcon className="w-4 h-4 flex-shrink-0" />
  <span className="truncate">{t.downloadSelected} ({selectedIds.size})</span>
</button>
```

**Benefits:**

- ✅ **No text wrapping**: whitespace-nowrap cho buttons
- ✅ **Icon protection**: flex-shrink-0 cho icons
- ✅ **Text truncation**: truncate cho long text
- ✅ **Button sizing**: flex-shrink-0 để buttons không bị shrink

### 3. **Records Info Section Fixes**

#### **Info Container**

```css
/* Trước */
<div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg px-3 py-2">

/* Sau */
<div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg px-3 py-2 min-w-0 flex-shrink-0">
```

#### **Select Element**

```css
/* Trước */
<select className="px-3 py-1 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">

/* Sau */
<select className="px-3 py-1 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-0">
```

#### **Text Elements**

```css
/* Trước */
<span className="text-stone-600 dark:text-stone-400 text-sm font-medium">
  {t.recordsPerPage}:
</span>

/* Sau */
<span className="text-stone-600 dark:text-stone-400 text-sm font-medium whitespace-nowrap">
  {t.recordsPerPage}:
</span>
```

**Benefits:**

- ✅ **No wrapping**: whitespace-nowrap cho text
- ✅ **Flexible select**: min-w-0 cho select element
- ✅ **Container control**: flex-shrink-0 để container không shrink
- ✅ **Divider protection**: flex-shrink-0 cho divider line

### 4. **Pagination Controls Fixes**

#### **Pagination Container**

```css
/* Trước */
<div className="flex items-center gap-1 w-full xl:w-auto justify-center xl:justify-end">

/* Sau */
<div className="flex items-center gap-1 w-full lg:w-auto justify-center lg:justify-end min-w-0 flex-shrink-0">
```

**Benefits:**

- ✅ **Better breakpoint**: lg thay vì xl
- ✅ **Width control**: min-w-0 và flex-shrink-0
- ✅ **No overflow**: Proper width constraints

#### **Button Controls**

```css
/* Trước */
<button className="hidden sm:flex p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-700 disabled:text-stone-300 dark:disabled:text-stone-600 disabled:hover:bg-transparent transition-all duration-150">

/* Sau */
<button className="hidden sm:flex p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-700 disabled:text-stone-300 dark:disabled:text-stone-600 disabled:hover:bg-transparent transition-all duration-150 flex-shrink-0">
```

**Benefits:**

- ✅ **No shrinking**: flex-shrink-0 cho buttons
- ✅ **Consistent sizing**: Buttons không bị squeeze
- ✅ **Better touch targets**: Proper button sizes

#### **Page Info Display**

```css
/* Trước */
<div className="flex items-center gap-2 mx-2">
  <span className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800 min-w-[2rem] text-center">
    {currentPage}
  </span>
  <span className="text-stone-500 dark:text-stone-400 text-sm hidden sm:inline">
    of
  </span>
  <span className="px-3 py-2 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium min-w-[2rem] text-center">
    {totalPages}
  </span>
</div>

/* Sau */
<div className="flex items-center gap-2 mx-2 min-w-0 flex-shrink-0">
  <span className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800 min-w-[2.5rem] text-center whitespace-nowrap">
    {currentPage}
  </span>
  <span className="text-stone-500 dark:text-stone-400 text-sm hidden sm:inline whitespace-nowrap">
    of
  </span>
  <span className="px-3 py-2 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium min-w-[2.5rem] text-center whitespace-nowrap">
    {totalPages}
  </span>
</div>
```

**Benefits:**

- ✅ **Larger badges**: min-w-[2.5rem] thay vì min-w-[2rem]
- ✅ **No text wrapping**: whitespace-nowrap cho all text
- ✅ **Container control**: min-w-0 và flex-shrink-0
- ✅ **Better spacing**: Consistent gap-2

### 5. **Responsive Design Improvements**

#### **Breakpoint Strategy**

```css
/* Desktop Layout */
flex-col lg:flex-row

/* Pagination Controls */
w-full lg:w-auto

/* Button Visibility */
hidden sm:flex
```

**Benefits:**

- ✅ **Better breakpoints**: lg thay vì xl cho better mobile experience
- ✅ **Flexible width**: w-full trên mobile, auto trên desktop
- ✅ **Progressive disclosure**: Hide complex controls trên mobile

#### **Mobile Optimizations**

- **Mobile (< 640px)**: Compact layout, hidden first/last buttons
- **Tablet (640px - 1024px)**: Show all buttons, responsive layout
- **Desktop (> 1024px)**: Full horizontal layout

### 6. **Width Control Strategy**

#### **CSS Classes Used**

```css
/* Width Control */
min-w-0              /* Allow shrinking */
flex-shrink-0        /* Prevent shrinking */
whitespace-nowrap    /* Prevent text wrapping */
truncate             /* Text truncation */

/* Layout Control */
w-full lg:w-auto     /* Responsive width */
justify-center lg:justify-end  /* Responsive alignment */
```

#### **Element-Specific Fixes**

```css
/* Action Buttons */
whitespace-nowrap flex-shrink-0

/* Icons */
flex-shrink-0

/* Text Content */
truncate

/* Page Badges */
min-w-[2.5rem] whitespace-nowrap

/* Containers */
min-w-0 flex-shrink-0
```

## Technical Implementation

### **Layout Structure**

```html
<div
  className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 p-4 mt-6 shadow-sm"
>
  <div
    className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 min-w-0"
  >
    <!-- Left Section - Actions & Info -->
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 min-w-0"
    >
      <!-- Action Buttons -->
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <!-- Download/Clear buttons with whitespace-nowrap flex-shrink-0 -->
      </div>

      <!-- Records Info -->
      <div
        className="flex items-center gap-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg px-3 py-2 min-w-0 flex-shrink-0"
      >
        <!-- Records per page with whitespace-nowrap -->
        <!-- Total records with whitespace-nowrap -->
      </div>
    </div>

    <!-- Right Section - Pagination -->
    <div
      className="flex items-center gap-1 w-full lg:w-auto justify-center lg:justify-end min-w-0 flex-shrink-0"
    >
      <!-- Pagination buttons with flex-shrink-0 -->
      <!-- Page info with min-w-[2.5rem] whitespace-nowrap -->
    </div>
  </div>
</div>
```

### **Width Control Strategy**

#### **Container Level**

- `min-w-0`: Allow containers to shrink when needed
- `flex-shrink-0`: Prevent important containers from shrinking
- `w-full lg:w-auto`: Responsive width control

#### **Element Level**

- `whitespace-nowrap`: Prevent text wrapping
- `flex-shrink-0`: Prevent buttons/icons from shrinking
- `truncate`: Handle long text gracefully
- `min-w-[2.5rem]`: Ensure minimum badge width

#### **Text Handling**

- `whitespace-nowrap`: For labels and short text
- `truncate`: For potentially long text
- `flex-shrink-0`: For important text elements

## Benefits

### **✅ User Experience**

- 🎯 **No text wrapping**: Clean, readable layout
- 📱 **Mobile-friendly**: Optimized for all screen sizes
- 🖱️ **Better interactions**: Proper button sizes
- 👁️ **Visual consistency**: Uniform spacing and alignment

### **✅ Developer Experience**

- 🔧 **Maintainable**: Clear width control strategy
- 📝 **Predictable**: Consistent behavior across breakpoints
- 🎨 **Scalable**: Easy to extend and modify
- 🐛 **Debuggable**: Clear CSS classes for width control

### **✅ Performance**

- ⚡ **Efficient rendering**: Optimized CSS
- 💾 **Minimal reflow**: Stable layouts
- 🎯 **Smooth interactions**: No layout shifts

## Before vs After

### **Layout Structure**

| Aspect         | Before            | After            |
| -------------- | ----------------- | ---------------- |
| **Container**  | Basic flex layout | min-w-0 control  |
| **Responsive** | xl breakpoints    | lg breakpoints   |
| **Width**      | Auto width        | Controlled width |
| **Overflow**   | Text wrapping     | No wrapping      |

### **Action Buttons**

| Aspect      | Before    | After             |
| ----------- | --------- | ----------------- |
| **Text**    | Wrapping  | whitespace-nowrap |
| **Icons**   | Shrinking | flex-shrink-0     |
| **Buttons** | Squeezing | flex-shrink-0     |
| **Layout**  | Cramped   | Proper spacing    |

### **Pagination Controls**

| Aspect        | Before          | After             |
| ------------- | --------------- | ----------------- |
| **Buttons**   | Small, cramped  | Proper sizing     |
| **Page Info** | min-w-[2rem]    | min-w-[2.5rem]    |
| **Text**      | Wrapping        | whitespace-nowrap |
| **Layout**    | Overflow issues | Controlled width  |

### **Records Info**

| Aspect        | Before     | After             |
| ------------- | ---------- | ----------------- |
| **Text**      | Wrapping   | whitespace-nowrap |
| **Select**    | Auto width | min-w-0 control   |
| **Container** | Flexible   | flex-shrink-0     |
| **Divider**   | Shrinking  | flex-shrink-0     |

## Future Improvements

### **Potential Enhancements**

1. **Dynamic width calculation**: Based on content length
2. **Smart truncation**: Context-aware text truncation
3. **Responsive typography**: Font size adjustments
4. **Advanced breakpoints**: More granular control
5. **Content prioritization**: Smart hiding of less important elements

### **Advanced Features**

1. **Fluid typography**: Responsive font sizes
2. **Container queries**: Element-based responsive design
3. **Smart spacing**: Dynamic gap calculation
4. **Content awareness**: Intelligent layout adjustments
5. **Performance optimization**: CSS containment
