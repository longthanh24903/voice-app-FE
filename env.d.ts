interface ImportMetaEnv {
  readonly VITE_PROXY_SERVER_URL?: string;
  readonly VITE_PROXY_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Temporary module declarations until dependencies are installed
declare module 'antd';
declare module 'react-icons/fi';


