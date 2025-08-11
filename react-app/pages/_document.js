import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* 여기에 Google SDK <script> 절대 넣지 않음 */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}