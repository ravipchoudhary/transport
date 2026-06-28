import type { AppProps } from 'next/app';
import '../index.css';
import '../dashboard.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
