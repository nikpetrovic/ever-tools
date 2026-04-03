export const IPC = {
  EMAILS_LIST:      'emails:list',
  EMAILS_GET:       'emails:get',
  EMAILS_DELETE:    'emails:delete',
  EMAILS_CLEAR:     'emails:clear',
  EMAILS_MARK_READ:        'emails:markRead',
  EMAILS_TRASH:            'emails:trash',
  EMAILS_RESTORE:          'emails:restore',
  EMAILS_DELETE_PERMANENT: 'emails:deletePermanent',
  EMAILS_CLEAR_TRASH:      'emails:clearTrash',
  SETTINGS_GET:     'settings:get',
  SETTINGS_SET:     'settings:set',
  SMTP_STATUS:      'smtp:status',
  NEW_EMAIL:        'emails:new',
  SMTP_RESTART:     'smtp:restart',
  SMTP_STOP:        'smtp:stop',
  TRAY_BADGE:       'tray:badge',
  WINDOW_MINIMIZE:         'window:minimize',
  WINDOW_MAXIMIZE_TOGGLE:  'window:maximizeToggle',
  WINDOW_CLOSE:            'window:close',
  WINDOW_MAXIMIZED_CHANGE: 'window:maximizedChange',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
