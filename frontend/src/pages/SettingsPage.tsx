import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Globe, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { API_URL } from '@/lib/utils'
import i18n from '@/i18n'

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
]

export default function SettingsPage() {
  const { t } = useTranslation()
  const { token, user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const currentLang = i18n.language?.slice(0, 2) ?? 'en'

  const handleLanguageSelect = async (code: string) => {
    if (code === currentLang || saving) return
    setSaving(true)
    try {
      // Apply immediately for snappy feel
      await i18n.changeLanguage(code)
      localStorage.setItem('sl_language', code)

      // Persist to DB if logged in
      if (token) {
        const res = await fetch(`${API_URL}/api/auth/settings`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ language: code }),
        })
        if (!res.ok) throw new Error('Failed to save')
        await refreshUser()
      }

      toast.success(t('settings.saved'))
    } catch {
      toast.error(t('settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-sl-black text-sl-silver">
      {/* Top bar */}
      <div className="border-b border-sl-gray-muted px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sl-silver-muted hover:text-sl-silver transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span className="text-xs uppercase tracking-wider font-bold">{t('common.back')}</span>
        </button>
        <h1 className="text-lg font-bold uppercase tracking-widest text-sl-blue text-glow-blue">
          {t('settings.title')}
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-10">
        {/* User info card */}
        {user && (
          <div className="flex items-center gap-4 p-4 bg-sl-gray border border-sl-gray-muted">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-sl-gray-light flex items-center justify-center">
                <Globe size={20} className="text-sl-silver-muted" />
              </div>
            )}
            <div>
              <p className="font-bold text-sl-silver">{user.name}</p>
              <p className="text-xs text-sl-silver-muted">
                {user.email ?? (user.is_guest ? 'Guest Account' : '')}
              </p>
            </div>
          </div>
        )}

        {/* Language section */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} className="text-sl-blue" />
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sl-silver-muted">
              {t('settings.language')}
            </h2>
          </div>
          <p className="text-xs text-sl-silver-muted mb-4 pl-5">
            {t('settings.languageDesc')}
          </p>

          <div className="space-y-2">
            {LANGUAGES.map((lang) => {
              const isActive = currentLang === lang.code
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  disabled={saving}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 border transition-all duration-200 cursor-pointer text-left ${
                    isActive
                      ? 'border-sl-blue bg-sl-blue/10 shadow-[0_0_12px_rgba(0,163,255,0.15)]'
                      : 'border-sl-gray-muted bg-sl-gray hover:border-sl-silver-muted hover:bg-sl-gray-light/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-xl leading-none">{lang.flag}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isActive ? 'text-sl-blue' : 'text-sl-silver'}`}>
                      {lang.native}
                    </p>
                    {lang.native !== lang.label && (
                      <p className="text-[11px] text-sl-silver-muted">{lang.label}</p>
                    )}
                  </div>
                  {isActive && (
                    <Check size={16} className="text-sl-blue shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
