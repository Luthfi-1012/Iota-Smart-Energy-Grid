"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCurrentAccount, ConnectButton } from "@iota/dapp-kit"
import { useEnergyContract, useUserListings, useUserTransactions, useAllListings, usePurchaseEvents, EnergyType, EnergyTypeLabels, ENERGY_TYPES } from "@/hooks/useEnergyContract"
import { Marketplace } from "@/components/Marketplace"
import { Zap, Sun, Wind, Activity, Battery, TrendingUp, Loader2, CheckCircle, XCircle, ListOrdered, MapPin, Check } from "lucide-react"
import { MARKETPLACE_ID } from "@/lib/config"

function getEnergyIcon(type: number) {
  if (type === ENERGY_TYPES.SOLAR) return Sun
  if (type === ENERGY_TYPES.WIND) return Wind
  if (type === ENERGY_TYPES.HYDRO) return Activity
  return Battery
}

function EnergyGrid() {
  const currentAccount = useCurrentAccount()
  const router = useRouter()
  const { actions, state, useUserProfile, hasProfile, hasExistingProfile, getProfileId } = useEnergyContract("testnet")
  const { createListing, buyEnergy, createProfile } = actions
  const { isLoading, error, txHash } = state
  const { data: profileData, isPending: profileLoading, refetch: refetchProfile } = useUserProfile()
  const { data: listingsData, refetch } = useUserListings("testnet")
  const { data: transactionsData, refetch: refetchTransactions } = useUserTransactions("testnet")
  const { data: purchaseEvents, isPending: eventsPending, refetch: refetchPurchaseEvents } = usePurchaseEvents("testnet")
  const { data: allListings, isPending: isAllPending, refetch: refetchAllListings } = useAllListings("testnet")

  const [energyAmount, setEnergyAmount] = useState("")
  const [pricePerKwh, setPricePerKwh] = useState("")
  const [energyType, setEnergyType] = useState<number>(ENERGY_TYPES.SOLAR)
  const [location, setLocation] = useState("")
  const [toasts, setToasts] = useState<Array<{ id: number; type: "success" | "error"; message: string }>>([])
  const [justCreated, setJustCreated] = useState(false)
  const [activeTab, setActiveTab] = useState<"dashboard" | "sell" | "marketplace" | "p2p" | "my_listings" | "transactions">("dashboard")
  const [energyData, setEnergyData] = useState<{ production: number; consumption: number; net: number; history: number[] }>({
    production: 12.5,
    consumption: 9.2,
    net: 3.3,
    history: [],
  })
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [profileId, setProfileId] = useState("")
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const [profileCreated, setProfileCreated] = useState(false)
  const profileAttempted = (typeof window !== "undefined") ? (window as any).__profileAttemptedRef ?? { current: false } : { current: false }
  if (typeof window !== "undefined") (window as any).__profileAttemptedRef = profileAttempted

  const isConnected = !!currentAccount
  const kwh = Number(energyAmount || 0) / 1000
  const totalValue = kwh * Number(pricePerKwh || 0)

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }

  useEffect(() => {
    if (error) setTimeout(() => addToast("error", error.message), 0)
  }, [error])

  useEffect(() => {
    if (txHash) {
      setTimeout(() => {
        addToast("success", "Listing created successfully")
        setJustCreated(true)
        setTimeout(() => setJustCreated(false), 1000)
      }, 0)
    }
  }, [txHash])

  useEffect(() => {
    if (currentAccount && !profileLoading) {
      const exists = hasExistingProfile(profileData)
      const existingId = getProfileId(profileData)
      if (exists && existingId && !profileId) {
        setProfileId(existingId)
        setProfileCreated(true)
      } else if (!exists && !profileAttempted.current && !isCreatingProfile) {
        profileAttempted.current = true
        setIsCreatingProfile(true)
        createProfile()
          .then(() => {
            addToast("success", "Profile created")
            setProfileCreated(true)
          })
          .finally(() => setIsCreatingProfile(false))
      }
    }
  }, [currentAccount, profileLoading, profileData, isCreatingProfile, profileId])
  useEffect(() => {
    const resp = profileData as unknown as { data?: any[] }
    const firstId = resp?.data?.[0]?.data?.objectId
    if (firstId && !profileId) {
      setProfileId(firstId)
    }
  }, [profileData, profileId])

  useEffect(() => {
    if (state.status === "confirmed") {
      setTimeout(() => {
        refetch?.()
        refetchProfile?.()
        refetchAllListings?.()
        refetchTransactions?.()
        refetchPurchaseEvents?.()
      }, 800)
    }
  }, [state.status, refetch, refetchProfile, refetchAllListings, refetchTransactions, refetchPurchaseEvents])
  useEffect(() => {
    const id = setInterval(() => {
      setEnergyData((prev) => {
        const p = Math.max(0, +(prev.production + (Math.random() - 0.5)).toFixed(2))
        const c = Math.max(0, +(prev.consumption + (Math.random() - 0.5)).toFixed(2))
        const n = +(p - c).toFixed(2)
        const h = [...prev.history, n].slice(-30)
        return { production: p, consumption: c, net: n, history: h }
      })
    }, 2000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])
  useEffect(() => {
    if (listingsData && listingsData.length > 0) {
      const mineSorted = [...listingsData].sort((a, b) => Number(b.created_at_ms || 0) - Number(a.created_at_ms || 0))
      const newest = mineSorted[0]
      if (newest?.id && newest.id !== lastCreatedId) setLastCreatedId(newest.id)
    }
  }, [listingsData, lastCreatedId])

  const parseLatLng = (s: string) => {
    const m = s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
    if (!m) return null
    return { lat: Number(m[1]), lng: Number(m[2]) }
  }

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const nearestPeers = useMemo(() => {
    const arr = allListings || []
    let withDist = arr.map((l) => {
      const parsed = parseLatLng(l.location)
      let dist = Number.POSITIVE_INFINITY
      if (parsed && userCoords) dist = haversineDistance(userCoords.lat, userCoords.lng, parsed.lat, parsed.lng)
      return { listing: l, distance: dist }
    })
    withDist.sort((a, b) => a.distance - b.distance)
    if (lastCreatedId) {
      const idx = withDist.findIndex((x) => x.listing.id === lastCreatedId)
      if (idx > 0) {
        const pinned = withDist.splice(idx, 1)[0]
        withDist.unshift(pinned)
      }
    }
    return withDist.slice(0, 6)
  }, [allListings, userCoords, lastCreatedId])

  const handleCreateListing = async () => {
    const amountWh = parseInt(energyAmount || "0", 10)
    const price = parseInt(pricePerKwh || "0", 10)
    if (!amountWh || amountWh <= 0) return
    if (!price || price <= 0) return
    if (!location.trim()) return
    await createListing(amountWh, price, energyType as EnergyType, location.trim())
    setTimeout(() => refetch?.(), 2000)
  }

  useEffect(() => {
    if (!isConnected) {
      router.replace("/")
    }
  }, [isConnected, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative">
      <div className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
        {toasts.map((t, idx) => (
          <div
            key={`${t.id}-${idx}`}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md transition-all duration-300 ${
              t.type === "success" ? "bg-green-600/20 border-green-500/40" : "bg-red-600/20 border-red-500/40"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-300" />
            ) : (
              <XCircle className="w-4 h-4 text-red-300" />
            )}
            <span className="text-sm">{t.message}</span>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-sm">{state.statusMessage || "Processing transaction..."}</span>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-lg font-semibold">IOTA Smart Energy Grid</div>
            <div className="text-xs text-white/70">
              {currentAccount?.address.slice(0, 6)}...{currentAccount?.address.slice(-4)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm">Powered by IOTA</span>
          </div>
          <ConnectButton />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {state.status === "submitted" && (
          <div className="mb-3 px-4 py-2 rounded-lg border border-blue-500/40 bg-blue-600/20 text-sm">
            Transaction submitted, waiting for confirmation...
          </div>
        )}
        {state.status === "failed" && (
          <div className="mb-3 px-4 py-2 rounded-lg border border-red-500/40 bg-red-600/20 text-sm">
            {state.statusMessage}
          </div>
        )}
        {state.status === "confirmed" && (
          <div className="mb-3 px-4 py-2 rounded-lg border border-green-500/40 bg-green-600/20 text-sm">
            <div className="flex items-center justify-between">
              <span>Success! Transaction confirmed.</span>
              {state.txHash && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://iotascan.com/testnet/tx/${state.txHash}`}
                  className="text-blue-300 hover:underline"
                >
                  {state.txHash.slice(0, 10)}...
                </a>
              )}
            </div>
          </div>
        )}
        {profileLoading && (
          <div className="mb-3 px-4 py-2 rounded-lg border border-blue-500/40 bg-blue-600/20 text-sm">
            Checking profile...
          </div>
        )}
        {!profileLoading && hasExistingProfile(profileData) && getProfileId(profileData) && (
          <div className="mb-3 px-4 py-2 rounded-lg border border-green-500/40 bg-green-600/20 text-sm">
            <div className="flex items-center justify-between">
              <span>✅ Profile Active</span>
              <span className="text-xs text-white/80">
                ID: {String(getProfileId(profileData)).slice(0, 8)}...{String(getProfileId(profileData)).slice(-6)}
              </span>
            </div>
          </div>
        )}
        {!MARKETPLACE_ID && (
          <div className="mb-4 px-4 py-2 rounded-lg border border-yellow-500/40 bg-yellow-600/20 text-sm">
            Marketplace belum dikonfigurasi. Isi `MARKETPLACE_ID` di `lib/config.ts` agar transaksi berjalan.
          </div>
        )}
        <div className="mb-4 flex items-center gap-2">
          {!hasProfile && !profileCreated && (
            <button
              onClick={() => {
                if (isCreatingProfile) return
                setIsCreatingProfile(true)
                createProfile()
                  .then(() => {
                    addToast("success", "Profile created")
                    setProfileCreated(true)
                  })
                  .finally(() => setIsCreatingProfile(false))
              }}
              disabled={profileLoading || isLoading || isCreatingProfile}
              className="px-3 py-1.5 rounded-lg border transition-all bg-blue-600 border-blue-500 disabled:opacity-50"
            >
              {profileLoading || isCreatingProfile ? "Creating Profile..." : "Create Profile"}
            </button>
          )}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg border transition-all ${activeTab === "dashboard" ? "bg-blue-600 border-blue-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-700"}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`px-3 py-1.5 rounded-lg border transition-all ${activeTab === "sell" ? "bg-blue-600 border-blue-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-700"}`}
          >
            Sell Energy
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`px-3 py-1.5 rounded-lg border transition-all ${activeTab === "marketplace" ? "bg-blue-600 border-blue-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-700"}`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab("p2p")}
            className={`px-3 py-1.5 rounded-lg border transition-all ${activeTab === "p2p" ? "bg-blue-600 border-blue-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-700"}`}
          >
            P2P
          </button>
          <button
            onClick={() => setActiveTab("my_listings")}
            className={`px-3 py-1.5 rounded-lg border transition-all ${activeTab === "my_listings" ? "bg-blue-600 border-blue-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-700"}`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-3 py-1.5 rounded-lg border transition-all ${activeTab === "transactions" ? "bg-blue-600 border-blue-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-700"}`}
          >
            Transactions
          </button>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-6 rounded-xl border border-green-500/30 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-300 text-sm">Production</span>
                  <Sun className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold mb-1">{energyData.production.toFixed(2)} kWh</div>
                <div className="text-xs text-white/70">Last update</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-6 rounded-xl border border-blue-500/30 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-300 text-sm">Consumption</span>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold mb-1">{energyData.consumption.toFixed(2)} kWh</div>
                <div className="text-xs text-white/70">Last update</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-6 rounded-xl border border-yellow-500/30 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-300 text-sm">Net</span>
                  <Battery className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold mb-1">{energyData.net.toFixed(2)} kWh</div>
                <div className="text-xs text-white/70">Production − Consumption</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur p-4">
              <div className="text-sm text-white/80 mb-3">Energy Flow</div>
              <div className="h-28 flex items-end gap-1">
                {energyData.history.map((v, i) => {
                  const h = Math.min(100, Math.max(10, Math.round((Math.abs(v) + 1) * 10)))
                  const pos = v >= 0
                  return (
                    <div
                      key={i}
                      className={`w-2 ${pos ? "bg-green-500/70" : "bg-red-500/70"}`}
                      style={{ height: `${h}px`, borderRadius: "2px" }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sell" && (
          <div
            className={`backdrop-blur-lg bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-5 transition-all duration-300 ${
              justCreated ? "ring-2 ring-green-400/60 scale-[1.01]" : ""
            }`}
          >
            <div className="text-lg font-semibold">Sell Your Energy</div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/80">Energy Amount (Wh)</label>
                <input
                  type="number"
                  min={0}
                  value={energyAmount}
                  onChange={(e) => setEnergyAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 outline-none focus:border-blue-500 transition-all"
                  placeholder="e.g. 5000"
                />
                <div className="text-xs text-white/70">{kwh.toFixed(2)} kWh</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/80">Price per kWh (IOTA)</label>
                <input
                  type="number"
                  min={0}
                  value={pricePerKwh}
                  onChange={(e) => setPricePerKwh(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 outline-none focus:border-blue-500 transition-all"
                  placeholder="e.g. 2"
                />
                <div className="text-xs text-white/70">Total: {isNaN(totalValue) ? "0.00" : totalValue.toFixed(2)} IOTA</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/80">Energy Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[ENERGY_TYPES.SOLAR, ENERGY_TYPES.WIND, ENERGY_TYPES.HYDRO, ENERGY_TYPES.GRID].map((t) => {
                    const Icon = getEnergyIcon(t)
                    const active = energyType === t
                    return (
                      <button
                        key={t}
                        onClick={() => setEnergyType(t)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                          active ? "bg-blue-600 border-blue-500" : "bg-slate-700 border-slate-600 hover:bg-slate-600"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{EnergyTypeLabels[t as EnergyType]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/80">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 outline-none focus:border-blue-500 transition-all"
                  placeholder="City, Country or lat,lng"
                />
              </div>
              <div>
                <button
                  onClick={handleCreateListing}
                  disabled={isLoading || !energyAmount || !pricePerKwh || !location}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Submitting..." : "Create Listing"}
                </button>
              </div>
              {txHash && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-green-600/20 border border-green-500/40 text-sm">
                  <span>Success. Tx: </span>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://iotascan.com/testnet/tx/${txHash}`}
                    className="text-blue-300 hover:underline"
                  >
                    {txHash}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "marketplace" && (
          <div className="backdrop-blur-lg bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6">
            <Marketplace />
          </div>
        )}

        {activeTab === "p2p" && (
          <div className="backdrop-blur-lg bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-4">
            <div className="text-lg font-semibold">P2P Trading</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <div className="text-xs text-white/70">Your Profile Object ID</div>
                <input
                  type="text"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  placeholder="Enter your profile object ID"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 outline-none"
                />
              </div>
              <div className="md:col-span-2 text-xs text-white/70 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{userCoords ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : "Location unavailable"}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isAllPending ? (
                <div className="col-span-full flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : nearestPeers.length === 0 ? (
                <div className="col-span-full space-y-4">
                  <div className="flex items-center justify-center py-6 text-sm text-white/80">
                    No peers found. Explore sample peers below.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { energy_type: ENERGY_TYPES.SOLAR, energy_amount: "7000", price_per_kwh: "2", location: "Bandung, ID", seller: "0xSAMPLE1" },
                      { energy_type: ENERGY_TYPES.WIND, energy_amount: "9000", price_per_kwh: "3", location: "Semarang, ID", seller: "0xSAMPLE2" },
                      { energy_type: ENERGY_TYPES.GRID, energy_amount: "6000", price_per_kwh: "2", location: "Jakarta, ID", seller: "0xSAMPLE3" },
                    ].map((l, idx) => {
                      const Icon = getEnergyIcon(l.energy_type as EnergyType)
                      const kwh = Number(l.energy_amount) / 1000
                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-lg p-4 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
                                <Icon className="w-5 h-5 text-blue-300" />
                              </div>
                              <div className="text-sm font-medium">{EnergyTypeLabels[l.energy_type as EnergyType]} (Sample)</div>
                            </div>
                            <div className="text-xs text-white/70">
                              {l.seller.slice(0, 6)}...{l.seller.slice(-4)}
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-white/70">Amount</div>
                              <div className="font-semibold">{kwh.toFixed(2)} kWh</div>
                            </div>
                            <div>
                              <div className="text-white/70">Price</div>
                              <div className="font-semibold">{Number(l.price_per_kwh)} IOTA/kWh</div>
                            </div>
                            <div>
                              <div className="text-white/70">Location</div>
                              <div className="font-semibold">{l.location}</div>
                            </div>
                            <div>
                              <div className="text-white/70">Distance</div>
                              <div className="font-semibold">Nearby</div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <button
                              disabled
                              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white/70 cursor-not-allowed"
                            >
                              Sample Peer
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                nearestPeers.map(({ listing: l, distance }, idx) => {
                  const Icon = getEnergyIcon(l.energy_type)
                  const kwh = Math.floor(Number(l.energy_amount) / 1000)
                  const total = kwh * Number(l.price_per_kwh)
                  const dist = distance === Number.POSITIVE_INFINITY ? "N/A" : `${distance.toFixed(1)} km`
                  return (
                    <div
                      key={`${l.id}-${idx}`}
                      className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-lg p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
                            <Icon className="w-5 h-5 text-blue-300" />
                          </div>
                          <div className="text-sm font-medium">{EnergyTypeLabels[l.energy_type as EnergyType]}</div>
                        </div>
                        <div className="text-xs text-white/70">
                          {l.seller.slice(0, 6)}...{l.seller.slice(-4)}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-white/70">Amount</div>
                          <div className="font-semibold">{kwh.toFixed(2)} kWh</div>
                        </div>
                        <div>
                          <div className="text-white/70">Price</div>
                          <div className="font-semibold">{Number(l.price_per_kwh)} IOTA/kWh</div>
                        </div>
                        <div>
                          <div className="text-white/70">Location</div>
                          <div className="font-semibold">{l.location || "-"}</div>
                        </div>
                        <div>
                          <div className="text-white/70">Distance</div>
                          <div className="font-semibold">{dist}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            if (!profileId.trim()) return
                            buyEnergy(l.id, profileId.trim(), total)
                          }}
                          disabled={isLoading || !profileId.trim()}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>Buy from peer</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "my_listings" && (
          <div className="backdrop-blur-lg bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-5">
            <div className="text-lg font-semibold">My Listings</div>
            {!listingsData || listingsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-lg bg-slate-700/40 border border-slate-600">
                <Battery className="w-8 h-8 text-white/70" />
                <div className="text-sm text-white/80">No active listings yet</div>
              </div>
            ) : (
              <div className="space-y-3">
                {[...listingsData]
                  .sort((a, b) => Number(b.created_at_ms || 0) - Number(a.created_at_ms || 0))
                  .map((l, idx) => {
                  const Icon = getEnergyIcon(l.energy_type)
                  const amountKwh = Number(l.energy_amount) / 1000
                  const total = amountKwh * Number(l.price_per_kwh)
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-700/40 border border-slate-600 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
                          <Icon className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{EnergyTypeLabels[l.energy_type as EnergyType]}</div>
                          <div className="text-xs text-white/70">{l.location}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{amountKwh.toFixed(2)} kWh</div>
                        <div className="text-xs text-white/70">@ {Number(l.price_per_kwh)} IOTA/kWh</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            l.is_active
                              ? "bg-green-600/20 border border-green-500/30 text-green-300"
                              : "bg-yellow-600/20 border border-yellow-500/30 text-yellow-300"
                          }`}
                        >
                          {l.is_active ? "Active" : "Sold"}
                        </span>
                        <div className="text-sm font-semibold">{isNaN(total) ? "0.00" : total.toFixed(2)} IOTA</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="backdrop-blur-lg bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-blue-300" />
              <div className="text-lg font-semibold">Transactions</div>
            </div>
            {!transactionsData || transactionsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-lg bg-slate-700/40 border border-slate-600">
                <Battery className="w-8 h-8 text-white/70" />
                <div className="text-sm text-white/80">No transactions yet</div>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const eventsTsByListing = new Map<string, number>()
                  for (const e of purchaseEvents || []) {
                    const ts = Number(e.timestampMs || 0)
                    const lid = String(e.listing_id || "")
                    if (lid && ts > 0) {
                      const prev = eventsTsByListing.get(lid) || 0
                      if (ts > prev) eventsTsByListing.set(lid, ts)
                    }
                  }
                  const txTs = (t: any) => {
                    const evTs = eventsTsByListing.get(String(t.listing_id)) || 0
                    const objTs = Number(t.timestamp || 0) * 1000
                    return evTs || objTs || 0
                  }
                  const sorted = [...transactionsData].sort((a, b) => txTs(b) - txTs(a))
                  return sorted.map((t, idx) => {
                    const Icon = getEnergyIcon(t.energy_type)
                    const amountKwh = Number(t.energy_amount) / 1000
                    const tsMs = eventsTsByListing.get(String(t.listing_id)) || (Number(t.timestamp || 0) * 1000)
                    const timeLabel = tsMs > 0 ? new Date(tsMs).toLocaleString() : "Recent"
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-700/40 border border-slate-600 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
                            <Icon className="w-5 h-5 text-blue-300" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{EnergyTypeLabels[t.energy_type as EnergyType]}</div>
                            <div className="text-xs text-white/70">{amountKwh.toFixed(2)} kWh</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{Number(t.total_price)} IOTA</div>
                          <div className="text-xs text-white/70">{timeLabel}</div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-purple-300" />
                <div className="text-lg font-semibold">Recent Purchases</div>
              </div>
              {!purchaseEvents || purchaseEvents.length === 0 ? (
                <div className="mt-2 flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-lg bg-slate-700/40 border border-slate-600">
                  {eventsPending ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  ) : (
                    <div className="text-sm text-white/80">No recent purchase events</div>
                  )}
                </div>
              ) : (
                <div className="mt-2 space-y-3">
                  {purchaseEvents.map((e, idx) => {
                    const amountKwh = Number(e.energy_amount) / 1000
                    const timeLabel = e.timestampMs > 0 ? new Date(e.timestampMs).toLocaleString() : "Recent"
                    return (
                      <div
                        key={`ev-${idx}`}
                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-700/40 border border-slate-600 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <div>
                          <div className="text-sm font-medium">{amountKwh.toFixed(2)} kWh</div>
                          <div className="text-xs text-white/70">
                            {e.buyer.slice(0, 6)}...{e.buyer.slice(-4)} → {e.seller.slice(0, 6)}...{e.seller.slice(-4)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{Number(e.total_price)} IOTA</div>
                          <div className="text-xs text-white/70">{timeLabel}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-5 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-sm">Powered by IOTA</span>
        </div>
      </div>
    </div>
  )
}

export default EnergyGrid
export { EnergyGrid }
