// 주문 알림 서비스워커
//
// 푸시에는 **내용이 들어있지 않다.** 안약 타이머와 같은 방식이다.
// 본문을 실으려면 aes128gcm 암호화가 필요한데, 그걸 피하려고
// 서버가 요약을 따로 적어두고 여기서 읽어와 알림을 만든다. (2026-09-04)

const 서버 = 'https://anyak-push.anyak-push.workers.dev';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

function 돈(값) {
  try { return Number(값 || 0).toLocaleString('ko-KR') + '원'; }
  catch (e) { return (값 || 0) + '원'; }
}

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let 요약 = null;
    try {
      const r = await fetch(서버 + '/' + encodeURIComponent('주문') + '/' + encodeURIComponent('요약'),
                            { cache: 'no-store' });
      요약 = await r.json();
    } catch (e) { /* 못 읽어도 알림은 띄운다 */ }

    let 제목 = '새 주문';
    let 몸 = '카페24에 새 주문이 들어왔습니다.';
    if (요약 && 요약.건수) {
      제목 = '새 주문 ' + 요약.건수 + '건';
      몸 = 돈(요약.금액) + (요약.줄 ? '  ·  ' + 요약.줄 : '');
    }

    await self.registration.showNotification(제목, {
      body: 몸,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: '주문알림',            // 같은 표라 여러 번 와도 알림이 쌓이지 않고 갱신된다
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: { 열곳: './' }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const 열곳 = (event.notification.data && event.notification.data.열곳) || './';
  event.waitUntil((async () => {
    const 창들 = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const 창 of 창들) {
      if (창.url.includes('/order/')) return 창.focus();
    }
    return self.clients.openWindow(열곳);
  })());
});
