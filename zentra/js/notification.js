/**
 * ZENTRA - Notification System Engine
 * Vanilla JavaScript ES6+
 * 
 * Features:
 * - LocalStorage persistence for user and admin notifications
 * - Unread count tracker and badge synchronization
 * - Notification dispatch helper for system events
 * - Slide-out notification drawer and real-time toast alerts
 */

/**
 * Dispatches a new notification to a specific user or admin
 * @param {string} targetId 'STUDENT_ID' | 'EMPLOYEE_ID' | 'ADMIN01'
 * @param {string} title 
 * @param {string} message 
 * @param {'info'|'success'|'warning'|'danger'} type 
 */
function sendNotification(targetId, title, message, type = 'info') {
  const notifId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date();
  const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const newNotif = {
    id: notifId,
    targetId: targetId,
    title: title,
    message: message,
    type: type,
    timestamp: timestamp,
    read: false
  };

  updateData(STORAGE_KEYS.NOTIFICATIONS, notifs => {
    return [newNotif, ...(notifs || [])];
  });

  // If current logged in user is the recipient or admin, show instant toast
  const currentUser = getLoggedInUser();
  if (currentUser && (currentUser.id === targetId || (currentUser.role === 'ADMIN' && targetId === 'ADMIN01'))) {
    showToast(`🔔 ${title}: ${message}`, type === 'danger' ? 'error' : type);
    updateNotificationBadge();
  }

  return newNotif;
}

/**
 * Updates the badge count in navigation header
 */
function updateNotificationBadge() {
  const user = getLoggedInUser();
  const badgeBtn = document.getElementById('notifBellBtn');
  if (!badgeBtn || !user) return;

  const notifs = loadData(STORAGE_KEYS.NOTIFICATIONS, []);
  const unreadCount = notifs.filter(n => (n.targetId === user.id || (user.role === 'ADMIN' && n.targetId === 'ADMIN01')) && !n.read).length;

  let countEl = badgeBtn.querySelector('.badge-count');
  if (unreadCount > 0) {
    if (!countEl) {
      countEl = document.createElement('span');
      countEl.className = 'badge-count';
      badgeBtn.appendChild(countEl);
    }
    countEl.textContent = unreadCount;
  } else if (countEl) {
    countEl.remove();
  }
}

/**
 * Periodically updates notification badge or on focus
 */
window.addEventListener('focus', () => {
  updateNotificationBadge();
});
