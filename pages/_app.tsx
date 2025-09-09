import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import '../app/globals.css';
import 'aos/dist/aos.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default appWithTranslation(MyApp);
