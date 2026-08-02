'use client';

import { useEffect, useState } from 'react';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { localeFontFamily } from '@/lib/brand-theme';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';
import { loadBirthProfile } from '@/lib/birth-profile';
import { loadTier, type MembershipTier } from '@/lib/membership';
import {
  fetchVaultBestCountriesReading,
  fetchVaultBusinessGeographyReading,
  fetchVaultDateOutfitReading,
  fetchVaultCheatingRadarReading,
  fetchVaultCompatibilityReading,
  fetchVaultPartnerProfileReading,
  fetchVaultCommunicationRiskReading,
  fetchVaultTrustPatternsReading,
  fetchVaultGhostDaysReading,
  fetchVaultHotAttractionDaysReading,
  fetchVaultLiveReelTimeReading,
  fetchVaultMarsReading,
  fetchVaultMoneyAskDaysReading,
  fetchVaultTodaysColorReading,
  fetchVaultTodaysPerfumeReading,
  fetchVaultYesDayReading,
  type VaultReadingLayer,
} from '@/lib/vault-reading';
import {
  PREVIEW_LOCK_LANGS,
  READING_UI,
  SECTION_LANGS,
  VAULT_PARTNER_SELECTION_COPY,
  VAULT_POWER_TIMING_COPY,
  isValidVaultSection,
  powerAdvisoryConfidenceLabel,
  type VaultSectionKey,
} from '@/lib/vault-section-i18n';
import {
  PEOPLE_CHANGED_EVENT,
  loadPeople,
  type Person,
} from '@/lib/people-storage';
import {
  isPartnerDependentVaultKey,
  shouldBumpPeopleRevisionForOpenVault,
  type PeopleVaultRefreshSignal,
} from '@/lib/vault-partner-dependent';
import {
  VAULT_SELECTED_PARTNER_STORAGE_KEY,
  findPersonById,
  loadSelectedVaultPartnerId,
  reconcileVaultPartnerSelection,
  saveSelectedVaultPartnerId,
  toVaultPartnerProfileGoal,
  toVaultRelationshipType,
} from '@/lib/vault-selected-partner';
import { buildVaultMissingInputNotice } from '@/lib/vault-missing-inputs';
import {
  powerRatingTitle,
  toPowerTimingView,
  vaultScoreBand,
  visiblePowerRating,
  type VaultPowerTimingView,
  type VaultScoreBand,
} from '@/lib/vault-power-windows';
import {
  VaultRankedDayChip,
  VaultYesDecisionSlot,
} from '@/components/vault/VaultPowerTiming';
import { VaultConfidentialReading } from '@/components/vault/VaultConfidentialReading';
import { VAULT_READING_PRESENTATION_COPY } from '@/lib/vault-reading-presentation';

/** Vault item index → live API key (same order as section.items). */
const LIVE_ITEM_API: Partial<Record<VaultSectionKey, string[]>> = {
  sensuality: ['mars'],
  // Power Calendar: Heat · Money · Ghost · Yes
  power: ['hot', 'money', 'ghost', 'yes'],
  // Style Timing: Color · Perfume · Post Time · Date Outfit
  look: ['color', 'perfume', 'reel', 'outfit'],
  // The Provider: Business Geography · Best Countries · Partner Profile · Compatibility
  provider: ['jupiter', 'countries', 'partner', 'compatibility'],
  // Shadow Room: Cheating Radar · Trust Patterns · Communication Risk · …
  shadow: ['radar', 'trust', 'communication', ''],
};

const LIVE_READING_KEYS = new Set([
  'mars',
  'ghost',
  'hot',
  'money',
  'yes',
  'color',
  'perfume',
  'reel',
  'outfit',
  'countries',
  'jupiter',
  'partner',
  'compatibility',
  'radar',
  'trust',
  'communication',
]);

export default function VaultSectionPage() {
  const params = useParams();
  const raw = typeof params.section === 'string' ? params.section : '';
  const [lang, setLangState] = useState<AppLang>('en');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [liveReading, setLiveReading] = useState<VaultReadingLayer | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<
    'needProfile' | 'api' | 'choosePartner' | 'unsupportedRelationship' | 'needPerson' | null
  >(null);
  const [missingNotice, setMissingNotice] = useState<
    ReturnType<typeof buildVaultMissingInputNotice>
  >(null);
  const [powerTiming, setPowerTiming] = useState<VaultPowerTimingView | null>(null);
  const [hasLiveApi, setHasLiveApi] = useState(false);
  const [tier, setTier] = useState<MembershipTier>(() =>
    typeof window !== 'undefined' ? loadTier() : 'free'
  );
  const [peopleRevision, setPeopleRevision] = useState(0);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedVaultPartnerId, setSelectedVaultPartnerId] = useState<
    string | null
  >(null);
  const [partnerSelectionReady, setPartnerSelectionReady] = useState(false);
  useQueuedEffect(() => {
    const stored = loadAppLang();
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
  }, []);

  // Vault partner selection: hydrate → People → reconcile → ready (browser only).
  useQueuedEffect(() => {
    const list = loadPeople();
    const persisted = loadSelectedVaultPartnerId();
    const next = reconcileVaultPartnerSelection({
      people: list,
      candidateId: persisted,
    });
    setPeople(list);
    setSelectedVaultPartnerId(next);
    if (next !== persisted) {
      saveSelectedVaultPartnerId(next);
    }
    setPartnerSelectionReady(true);
  }, []);

  useEffect(() => {
    const onChange = () => setTier(loadTier());
    window.addEventListener('storage', onChange);
    window.addEventListener('planet-life-membership-changed', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('planet-life-membership-changed', onChange);
    };
  }, []);

  useEffect(() => {
    const resolveOpenApiKey = (): string | undefined => {
      if (!isValidVaultSection(raw) || !openItem) return undefined;
      const sectionData = SECTION_LANGS[lang][raw];
      const idx = sectionData.items.findIndex((i) => i.label === openItem);
      return (LIVE_ITEM_API[raw] ?? [])[idx];
    };

    const bumpIfNeeded = (signal: PeopleVaultRefreshSignal) => {
      if (
        shouldBumpPeopleRevisionForOpenVault({
          openApiKey: resolveOpenApiKey(),
          signal,
        })
      ) {
        setPeopleRevision((n) => n + 1);
      }
    };

    const onPeopleChanged = () => bumpIfNeeded({ type: 'people-changed' });
    const onStorage = (event: StorageEvent) =>
      bumpIfNeeded({ type: 'storage', key: event.key });

    window.addEventListener(PEOPLE_CHANGED_EVENT, onPeopleChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(PEOPLE_CHANGED_EVENT, onPeopleChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [openItem, lang, raw]);

  // Reconcile session selection when People data changes (not a selection signal).
  useQueuedEffect(() => {
    if (!partnerSelectionReady) return;
    const list = loadPeople();
    setPeople(list);
    setSelectedVaultPartnerId((prev) => {
      const next = reconcileVaultPartnerSelection({
        people: list,
        candidateId: prev,
      });
      if (next !== prev) {
        saveSelectedVaultPartnerId(next);
      }
      return next;
    });
  }, [peopleRevision, partnerSelectionReady]);

  // Cross-tab selection persistence → React state (reconcile against People).
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key !== VAULT_SELECTED_PARTNER_STORAGE_KEY &&
        event.key !== null
      ) {
        return;
      }
      const list = loadPeople();
      setPeople(list);
      const fromStorage = loadSelectedVaultPartnerId();
      const next = reconcileVaultPartnerSelection({
        people: list,
        candidateId: fromStorage,
      });
      setSelectedVaultPartnerId(next);
      if (next !== fromStorage) {
        saveSelectedVaultPartnerId(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const selectVaultPartner = (id: string) => {
    setSelectedVaultPartnerId(id);
    saveSelectedVaultPartnerId(id);
  };

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  useQueuedEffect(() => {
    if (!isValidVaultSection(raw) || !openItem) {
      setLiveReading(null);
      setHasLiveApi(false);
      setLiveError(null);
      setLiveLoading(false);
      setMissingNotice(null);
      setPowerTiming(null);
      return;
    }
    const sectionData = SECTION_LANGS[lang][raw];
    const idx = sectionData.items.findIndex((i) => i.label === openItem);
    const apiKey = (LIVE_ITEM_API[raw] ?? [])[idx];

    if (
      apiKey === 'mars' ||
      apiKey === 'ghost' ||
      apiKey === 'hot' ||
      apiKey === 'money' ||
      apiKey === 'yes' ||
      apiKey === 'color' ||
      apiKey === 'perfume' ||
      apiKey === 'reel' ||
      apiKey === 'outfit' ||
      apiKey === 'countries' ||
      apiKey === 'jupiter' ||
      apiKey === 'partner' ||
      apiKey === 'compatibility' ||
      apiKey === 'radar' ||
      apiKey === 'trust' ||
      apiKey === 'communication'
    ) {
      setHasLiveApi(true);
      const profile = loadBirthProfile();
      if (!profile) {
        setLiveReading(null);
        setLiveError('needProfile');
        setLiveLoading(false);
        setMissingNotice(null);
        setPowerTiming(null);
        return;
      }

      const partnerDependent = isPartnerDependentVaultKey(apiKey);
      if (partnerDependent && !partnerSelectionReady) {
        setLiveReading(null);
        setLiveError(null);
        setLiveLoading(false);
        setMissingNotice(null);
        setPowerTiming(null);
        return;
      }

      let selectedPartner: Person | null = null;
      let partnerGoal: ReturnType<typeof toVaultPartnerProfileGoal> = null;
      let compatRel: ReturnType<typeof toVaultRelationshipType> = null;

      if (partnerDependent) {
        // Fresh People read inside the effect — do not depend on `people` array identity.
        const peopleNow = loadPeople();
        const selected = findPersonById(peopleNow, selectedVaultPartnerId);
        if (!selectedVaultPartnerId || !selected) {
          setLiveReading(null);
          setPowerTiming(null);
          setMissingNotice(null);
          setLiveLoading(false);
          if (peopleNow.length === 0) {
            setLiveError('needPerson');
          } else {
            setLiveError('choosePartner');
          }
          return;
        }
        selectedPartner = selected;
        partnerGoal = toVaultPartnerProfileGoal(selected.relationship);
        compatRel = toVaultRelationshipType(selected.relationship);
        if (apiKey === 'partner' && !partnerGoal) {
          setLiveReading(null);
          setPowerTiming(null);
          setMissingNotice(null);
          setLiveLoading(false);
          setLiveError('unsupportedRelationship');
          return;
        }
        if (
          (apiKey === 'compatibility' ||
            apiKey === 'radar' ||
            apiKey === 'trust' ||
            apiKey === 'communication') &&
          !compatRel
        ) {
          setLiveReading(null);
          setPowerTiming(null);
          setMissingNotice(null);
          setLiveLoading(false);
          setLiveError('unsupportedRelationship');
          return;
        }
      }

      let cancelled = false;
      setLiveLoading(true);
      setLiveError(null);
      setLiveReading(null);
      setMissingNotice(null);
      setPowerTiming(null);

      const fetchReading =
        apiKey === 'ghost'
          ? fetchVaultGhostDaysReading(profile, lang)
          : apiKey === 'hot'
            ? fetchVaultHotAttractionDaysReading(profile, lang)
            : apiKey === 'money'
              ? fetchVaultMoneyAskDaysReading(profile, lang)
              : apiKey === 'yes'
                ? fetchVaultYesDayReading(profile, lang)
                : apiKey === 'color'
                  ? fetchVaultTodaysColorReading(profile, lang)
                  : apiKey === 'perfume'
                    ? fetchVaultTodaysPerfumeReading(profile, lang)
                    : apiKey === 'reel'
                      ? fetchVaultLiveReelTimeReading(profile, lang)
                      : apiKey === 'outfit'
                        ? fetchVaultDateOutfitReading(profile, lang)
                        : apiKey === 'countries'
                          ? fetchVaultBestCountriesReading(profile, lang)
                          : apiKey === 'jupiter'
                            ? fetchVaultBusinessGeographyReading(profile, lang)
                            : apiKey === 'partner' && partnerGoal
                              ? fetchVaultPartnerProfileReading(
                                  profile,
                                  lang,
                                  selectedPartner,
                                  partnerGoal,
                                )
                              : apiKey === 'compatibility' && compatRel
                                ? fetchVaultCompatibilityReading(
                                    profile,
                                    lang,
                                    selectedPartner,
                                    compatRel,
                                  )
                                : apiKey === 'radar' && compatRel
                                  ? fetchVaultCheatingRadarReading(
                                      profile,
                                      lang,
                                      selectedPartner,
                                      compatRel,
                                    )
                                  : apiKey === 'trust' && compatRel
                                    ? fetchVaultTrustPatternsReading(
                                        profile,
                                        lang,
                                        selectedPartner,
                                        compatRel,
                                      )
                                    : apiKey === 'communication' && compatRel
                                      ? fetchVaultCommunicationRiskReading(
                                          profile,
                                          lang,
                                          selectedPartner,
                                          compatRel,
                                        )
                                      : apiKey === 'mars'
                                        ? fetchVaultMarsReading(profile, lang)
                                        : null;
      if (!fetchReading) {
        setLiveLoading(false);
        return;
      }
      fetchReading
        .then((res) => {
          if (cancelled) return;
          setLiveReading(res.reading);
          setPowerTiming(toPowerTimingView(apiKey, res));
          const missing =
            res && typeof res === 'object' && 'missing_inputs' in res
              ? (res as { missing_inputs?: unknown }).missing_inputs
              : undefined;
          setMissingNotice(buildVaultMissingInputNotice(missing, lang));
        })
        .catch(() => {
          if (!cancelled) {
            setLiveError('api');
            setLiveReading(null);
            setMissingNotice(null);
            setPowerTiming(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLiveLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    setHasLiveApi(false);
    setLiveReading(null);
    setLiveError(null);
    setLiveLoading(false);
    setMissingNotice(null);
    setPowerTiming(null);
  }, [
    openItem,
    lang,
    raw,
    tier,
    peopleRevision,
    selectedVaultPartnerId,
    partnerSelectionReady,
  ]);

  const unlocked = tier === 'premium' || tier === 'vip';
  const t = SECTION_LANGS[lang];
  const rui = READING_UI[lang];
  const powerUi = VAULT_POWER_TIMING_COPY[lang];
  const partnerUi = VAULT_PARTNER_SELECTION_COPY[lang];
  const selectedPartner = findPersonById(people, selectedVaultPartnerId);
  const openApiKeyForUi = (() => {
    if (!isValidVaultSection(raw) || !openItem) return undefined;
    const idx = SECTION_LANGS[lang][raw].items.findIndex((i) => i.label === openItem);
    return (LIVE_ITEM_API[raw] ?? [])[idx];
  })();
  const showPartnerIdentity = isPartnerDependentVaultKey(openApiKeyForUi);
  const dir = HOME_LANGS[lang].dir;
  const fontFamily = localeFontFamily(lang);

  const formatPowerDate = (iso: string) => {
    const locale =
      lang === 'fa' ? 'fa-IR' : lang === 'ar' ? 'ar' : lang === 'ru' ? 'ru-RU' : 'en-GB';
    const tms = Date.parse(`${iso}T00:00:00Z`);
    if (!Number.isFinite(tms)) return iso;
    return new Date(tms).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  const bandLabel = (band: VaultScoreBand) =>
    band === 'strongest'
      ? powerUi.strongest
      : band === 'supportive'
        ? powerUi.supportive
        : powerUi.lighter;


  if (!isValidVaultSection(raw)) {
    return (
      <AppShell lang={lang} setLang={setLang} dir={dir} navLabels={HOME_LANGS[lang].nav} fontFamily={fontFamily}>
        <div className="max-w-lg mx-auto px-6 py-12 text-center">
          <p className="fi text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Section not found.
          </p>
          <Link href="/vault" className="fi text-sm mt-4 inline-block" style={{ color: '#D4AF37' }}>
            {t.back}
          </Link>
        </div>
      </AppShell>
    );
  }

  const section = t[raw];

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={fontFamily}
    >
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(212,175,55,0.12), transparent 70%)',
          }}
        />

        <div className="relative max-w-2xl mx-auto px-6 py-10">
          <Link
            href="/vault"
            className="fi text-xs no-underline inline-block mb-6"
            style={{ color: 'rgba(212,175,55,0.75)' }}
          >
            {t.back}
          </Link>

          <div className="mb-2">
            <span
              className="fi text-[10px] tracking-[0.25em] uppercase"
              style={{ color: 'rgba(212,175,55,0.5)' }}
            >
              {t.vaultHome}
            </span>
          </div>
          <h1
            className="fc text-3xl md:text-4xl mb-2"
            style={{
              background: 'linear-gradient(135deg, #F2CF75, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {section.title}
          </h1>
          <p className="fi text-xs mb-4" style={{ color: 'rgba(212,175,55,0.55)' }}>
            {section.sub}
          </p>
          <p className="fi text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {section.intro}
          </p>

          <div className="space-y-3 mb-8">
            {section.items.map((item, itemIdx) => {
              const isOpen = openItem === item.label;
              const lock = PREVIEW_LOCK_LANGS[lang];
              const itemApiKey = (LIVE_ITEM_API[raw] ?? [])[itemIdx];
              const showLive =
                isOpen &&
                hasLiveApi &&
                !!itemApiKey &&
                LIVE_READING_KEYS.has(itemApiKey) &&
                openItem === item.label;
              const itemLive = !!itemApiKey && LIVE_READING_KEYS.has(itemApiKey);
              const powerConfidenceLabel =
                raw === 'power' && showLive
                  ? powerAdvisoryConfidenceLabel(liveReading?.confidence, powerUi)
                  : null;
              return (
                <div
                  key={item.label}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(40,20,40,0.55), rgba(20,14,28,0.55))',
                    border: isOpen
                      ? '1px solid rgba(212,175,55,0.35)'
                      : '1px solid rgba(212,175,55,0.15)',
                    boxShadow: isOpen
                      ? '0 0 28px rgba(212,175,55,0.12)'
                      : 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenItem(isOpen ? null : item.label)
                    }
                    className="w-full text-left p-4 flex items-start justify-between gap-4 transition-colors"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex-1">
                      <div
                        className="fc text-sm mb-1"
                        style={{ color: '#D4AF37' }}
                      >
                        {item.label}
                      </div>
                      <div
                        className="fi text-xs"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        {item.hint}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="fi text-[10px] px-2 py-1 rounded-full"
                        style={{
                          background: itemLive
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(212,175,55,0.1)',
                          border: itemLive
                            ? '1px solid rgba(34,197,94,0.35)'
                            : '1px solid rgba(212,175,55,0.2)',
                          color: itemLive
                            ? 'rgba(134,239,172,0.9)'
                            : 'rgba(212,175,55,0.7)',
                        }}
                      >
                        {itemLive ? 'LIVE' : lock.comingSoon}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(212,175,55,0.7)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.25s',
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      className="px-4 pb-4 pt-2"
                      style={{
                        borderTop: '1px solid rgba(212,175,55,0.1)',
                      }}
                    >
                      {showLive ? (
                        <>
                          <div
                            className="fi text-[10px] tracking-[0.2em] uppercase mb-2"
                            style={{ color: 'rgba(134,239,172,0.75)' }}
                          >
                            {rui.liveLabel}
                          </div>
                          {showPartnerIdentity && partnerSelectionReady && (
                            <div className="mb-3 space-y-2" data-vault-partner-identity="true">
                              {selectedPartner && (
                                <p
                                  className="fi text-xs"
                                  style={{ color: 'rgba(242,207,117,0.95)' }}
                                  data-vault-partner-name={selectedPartner.name}
                                >
                                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                                    {partnerUi.readingFor}
                                  </span>
                                  {' '}
                                  {selectedPartner.name}
                                </p>
                              )}
                              {people.length > 1 && (
                                <label className="block">
                                  <span
                                    className="fi text-[10px] tracking-[0.16em] uppercase block mb-1"
                                    style={{ color: 'rgba(255,255,255,0.45)' }}
                                  >
                                    {partnerUi.selectLabel}
                                  </span>
                                  <select
                                    className="w-full fi text-xs rounded-lg px-3 py-2"
                                    style={{
                                      background: 'rgba(0,0,0,0.35)',
                                      border: '1px solid rgba(212,175,55,0.28)',
                                      color: '#F2CF75',
                                    }}
                                    value={selectedVaultPartnerId ?? ''}
                                    onChange={(e) => {
                                      const id = e.target.value;
                                      if (id) selectVaultPartner(id);
                                    }}
                                    aria-label={partnerUi.selectLabel}
                                  >
                                    <option value="" disabled>
                                      {partnerUi.choosePartner}
                                    </option>
                                    {people.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}
                              {!selectedPartner && people.length > 1 && (
                                <p
                                  className="fi text-xs leading-relaxed"
                                  style={{ color: 'rgba(255,255,255,0.65)' }}
                                  data-vault-choose-partner="true"
                                >
                                  {partnerUi.choosePartnerHint}
                                </p>
                              )}
                            </div>
                          )}
                          {liveLoading && (
                            <p
                              className="fi text-xs py-4"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                              {showPartnerIdentity ? partnerUi.loading : rui.loading}
                            </p>
                          )}
                          {!liveLoading && liveError === 'needProfile' && (
                            <div className="mb-3">
                              <p
                                className="fi text-xs leading-relaxed mb-3"
                                style={{ color: 'rgba(255,255,255,0.65)' }}
                              >
                                {rui.needProfile}
                              </p>
                              <Link
                                href="/profile"
                                className="fc text-xs tracking-widest px-4 py-2 rounded-lg inline-flex no-underline"
                                style={{
                                  background: 'rgba(212,175,55,0.15)',
                                  border: '1px solid rgba(212,175,55,0.35)',
                                  color: '#F2CF75',
                                }}
                              >
                                {rui.goProfile}
                              </Link>
                            </div>
                          )}
                          {!liveLoading && liveError === 'api' && (
                            <p
                              className="fi text-xs leading-relaxed"
                              style={{ color: 'rgba(248,113,113,0.85)' }}
                            >
                              {showPartnerIdentity ? partnerUi.apiError : rui.apiError}
                            </p>
                          )}
                          {!liveLoading && liveError === 'needPerson' && (
                            <div className="mb-3" data-vault-no-people="true">
                              <p
                                className="fi text-xs leading-relaxed mb-3"
                                style={{ color: 'rgba(255,255,255,0.65)' }}
                              >
                                {partnerUi.noPeopleBody}
                              </p>
                              <Link
                                href="/people"
                                className="fc text-xs tracking-widest px-4 py-2 rounded-lg inline-flex no-underline"
                                style={{
                                  background: 'rgba(212,175,55,0.15)',
                                  border: '1px solid rgba(212,175,55,0.35)',
                                  color: '#F2CF75',
                                }}
                              >
                                {partnerUi.addPersonCta}
                              </Link>
                            </div>
                          )}
                          {!liveLoading && liveError === 'unsupportedRelationship' && (
                            <div className="mb-3" data-vault-unsupported-relationship="true">
                              <p
                                className="fi text-xs leading-relaxed mb-2"
                                style={{ color: 'rgba(255,255,255,0.72)' }}
                              >
                                {partnerUi.unsupportedRelationship}
                              </p>
                              {openApiKeyForUi === 'partner' && (
                                <p
                                  className="fi text-xs leading-relaxed mb-3"
                                  style={{ color: 'rgba(255,255,255,0.55)' }}
                                  data-vault-partner-profile-note="true"
                                >
                                  {partnerUi.partnerProfileVsCompatNote}
                                </p>
                              )}
                              <Link
                                href="/people"
                                className="fc text-xs tracking-widest px-4 py-2 rounded-lg inline-flex no-underline"
                                style={{
                                  background: 'rgba(212,175,55,0.15)',
                                  border: '1px solid rgba(212,175,55,0.35)',
                                  color: '#F2CF75',
                                }}
                              >
                                {partnerUi.changeRelationshipCta}
                              </Link>
                            </div>
                          )}
                          {!liveLoading && raw === 'power' && powerTiming && (
                            <div className="mt-3 space-y-2">
                              {powerTiming.kind === 'ranked_days' && (
                                <>
                                  <div
                                    className="fi text-[10px] tracking-[0.2em] uppercase"
                                    style={{ color: 'rgba(212,175,55,0.7)' }}
                                  >
                                    {powerUi.topDays}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {powerTiming.days.map((day) => {
                                      const band = vaultScoreBand(day.score);
                                      const visibleRating = visiblePowerRating(day.rating);
                                      const ratingTitle = powerRatingTitle(day.rating);
                                      return (
                                        <VaultRankedDayChip
                                          key={`${day.date}-${day.score}`}
                                          dateLabel={formatPowerDate(day.date)}
                                          score={day.score}
                                          band={band}
                                          bandLabel={bandLabel(band)}
                                          rating={visibleRating}
                                          title={ratingTitle ?? bandLabel(band)}
                                        />
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                              {powerTiming.kind === 'yes_slots' && (
                                <div className="space-y-2">
                                  {(
                                    [
                                      ['ask', powerUi.ask, powerTiming.ask],
                                      ['commit', powerUi.commit, powerTiming.commit],
                                      ['sign', powerUi.sign, powerTiming.sign],
                                    ] as const
                                  ).map(([slotKey, slotLabel, slot]) => {
                                    const band = vaultScoreBand(slot.score);
                                    return (
                                      <VaultYesDecisionSlot
                                        key={slotKey}
                                        label={slotLabel}
                                        dateLabel={formatPowerDate(slot.date)}
                                        score={slot.score}
                                        band={band}
                                        bandLabel={bandLabel(band)}
                                        confidence={slot.confidence}
                                        rating={slot.rating}
                                      />
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          {!liveLoading && liveReading && (
                            <VaultConfidentialReading
                              className="mt-3 rounded-lg p-3"
                              style={{
                                background: 'rgba(0,0,0,0.22)',
                                border: '1px solid rgba(212,175,55,0.12)',
                              }}
                              lang={lang}
                              reading={liveReading}
                              labels={VAULT_READING_PRESENTATION_COPY[lang]}
                              confidenceLabel={
                                powerConfidenceLabel
                                  ? `${powerUi.confidence}: ${powerConfidenceLabel}`
                                  : null
                              }
                            />
                          )}
                          {!liveLoading && liveReading && missingNotice && (
                            <div className="mt-3">
                              <p
                                className="fi text-xs leading-relaxed mb-2"
                                style={{ color: 'rgba(255,255,255,0.62)' }}
                              >
                                {missingNotice.message}
                              </p>
                              {missingNotice.cta && (
                                <Link
                                  href={missingNotice.cta.href}
                                  className="fc text-xs tracking-widest px-4 py-2 rounded-lg inline-flex no-underline"
                                  style={{
                                    background: 'rgba(212,175,55,0.15)',
                                    border: '1px solid rgba(212,175,55,0.35)',
                                    color: '#F2CF75',
                                  }}
                                >
                                  {missingNotice.cta.label}
                                </Link>
                              )}
                            </div>
                          )}
                        </>
                      ) : unlocked ? (
                        <>
                          <div
                            className="fi text-[10px] tracking-[0.2em] uppercase mb-2 inline-flex items-center gap-1.5"
                            style={{ color: 'rgba(134,239,172,0.85)' }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="5" y="11" width="14" height="9" rx="2" />
                              <path d="M8 11V7a4 4 0 0 1 7.5-2" />
                            </svg>
                            {lock.unlockedBadge}
                          </div>
                          <p
                            className="fi text-xs leading-relaxed mb-2"
                            style={{ color: 'rgba(255,255,255,0.72)' }}
                          >
                            {lock.teaser}
                          </p>
                          <p
                            className="fi text-[11px] leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.45)' }}
                          >
                            {lock.unlockedNote}
                          </p>
                        </>
                      ) : (
                        <>
                          <div
                            className="fi text-[10px] tracking-[0.2em] uppercase mb-2"
                            style={{ color: 'rgba(212,175,55,0.6)' }}
                          >
                            {lock.sampleLabel}
                          </div>
                          <div
                            className="rounded-lg p-3 mb-3 relative overflow-hidden"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px dashed rgba(212,175,55,0.18)',
                            }}
                          >
                            <p
                              className="fi text-xs leading-relaxed italic"
                              style={{
                                color: 'rgba(255,255,255,0.55)',
                                filter: 'blur(2px)',
                                userSelect: 'none',
                              }}
                              aria-hidden
                            >
                              ████ ████████ ██ ████, ███████ ████████ ██ ██████.
                              ████ ███████ ██ ███, ███ █████████ ██ ██████ █████.
                              ████ ████████ ██ ██████ ███, █████████ ██ ████.
                            </p>
                            <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                background:
                                  'linear-gradient(180deg, rgba(20,14,28,0.4), rgba(20,14,28,0.85))',
                              }}
                            >
                              <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#D4AF37"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="5" y="11" width="14" height="9" rx="2" />
                                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                              </svg>
                            </div>
                          </div>
                          <p
                            className="fi text-xs leading-relaxed mb-3"
                            style={{ color: 'rgba(255,255,255,0.6)' }}
                          >
                            {lock.teaser}
                          </p>
                          <Link
                            href="/upgrade"
                            title={lock.premium}
                            className="fc text-xs tracking-widest px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-all hover:scale-[1.02] no-underline"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(181,148,16,0.22))',
                              border: '1px solid rgba(212,175,55,0.4)',
                              color: '#F2CF75',
                              letterSpacing: '0.12em',
                              cursor: 'pointer',
                            }}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
                            </svg>
                            {lock.unlock}
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: 'rgba(212,175,55,0.05)',
              border: '1px solid rgba(212,175,55,0.12)',
            }}
          >
            <p className="fi text-xs mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {section.coming}
            </p>
            <p className="fi text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {t.previewNote}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
