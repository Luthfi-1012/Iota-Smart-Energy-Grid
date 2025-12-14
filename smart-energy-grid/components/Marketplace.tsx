"use client"

import { useEffect, useMemo, useState } from "react"
import { EnergyType, EnergyTypeLabels, useAllListings, useEnergyContract, ENERGY_TYPES } from "@/hooks/useEnergyContract"
import { Sun, Wind, Activity, Battery, Filter, MapPin, X, Check, Loader2 } from "lucide-react"
import { MARKETPLACE_ID } from "@/lib/config"

function getEnergyIcon(type: number) {
  if (type === ENERGY_TYPES.SOLAR) return Sun
  if (type === ENERGY_TYPES.WIND) return Wind
  if (type === ENERGY_TYPES.HYDRO) return Activity
  return Battery
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

function parseLatLng(s: string) {
  const m = s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
  if (!m) return null
  return { lat: Number(m[1]), lng: Number(m[2]) }
}

export default function Marketplace({ pinId }: { pinId?: string }) {
  const { data: allListings, isPending, refetch } = useAllListings("testnet")
  const { actions, state, useUserProfile, hasExistingProfile, getProfileId } = useEnergyContract("testnet")
  const { buyEnergy } = actions
  const { isLoading, error, txHash } = state
  const { data: profileData, isPending: profileLoading } = useUserProfile()

  const [filterType, setFilterType] = useState<EnergyType | "all">("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [locationQuery, setLocationQuery] = useState("")
  const [sortBy, setSortBy] = useState<"price_asc" | "distance" | "newest">("price_asc")
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [profileId, setProfileId] = useState("")
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [notify, setNotify] = useState<string | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])
  useEffect(() => {
    if (state.status === "confirmed") {
      setTimeout(() => refetch?.(), 800)
    }
  }, [state.status, refetch])

  const filtered = useMemo(() => {
    let arr = allListings || []
    if (purchasedIds.size > 0) arr = arr.filter((l) => !purchasedIds.has(l.id))
    if (filterType !== "all") arr = arr.filter((l) => l.energy_type === filterType)
    arr = arr.filter((l) => {
      const price = Number(l.price_per_kwh)
      return price >= priceRange[0] && price <= priceRange[1]
    })
    if (locationQuery.trim()) {
      const q = locationQuery.toLowerCase()
      arr = arr.filter((l) => l.location.toLowerCase().includes(q))
    }
    const withDistance = arr.map((l) => {
      const parsed = parseLatLng(l.location)
      let dist = Number.POSITIVE_INFINITY
      if (parsed && userCoords) dist = haversineDistance(userCoords.lat, userCoords.lng, parsed.lat, parsed.lng)
      return { listing: l, distance: dist }
    })
    if (sortBy === "price_asc") {
      withDistance.sort((a, b) => Number(a.listing.price_per_kwh) - Number(b.listing.price_per_kwh))
    } else if (sortBy === "distance") {
      withDistance.sort((a, b) => a.distance - b.distance)
    } else if (sortBy === "newest") {
      withDistance.sort((a, b) => (Number(b.listing.created_at_ms || 0) - Number(a.listing.created_at_ms || 0)))
    }
    if (pinId) {
      const idx = withDistance.findIndex((x) => x.listing.id === pinId)
      if (idx > 0) {
        const pinned = withDistance.splice(idx, 1)[0]
        withDistance.unshift(pinned)
      }
    }
    return withDistance
  }, [allListings, filterType, priceRange, locationQuery, sortBy, userCoords, purchasedIds, pinId])

  const openConfirm = (idx: number) => {
    setSelectedIndex(idx)
    setConfirmOpen(true)
  }

  const closeConfirm = () => {
    setConfirmOpen(false)
    setSelectedIndex(null)
  }

  useEffect(() => {
    const id = getProfileId(profileData)
    if (id && !profileId) setProfileId(id)
  }, [profileData, profileId, getProfileId])

  const handleBuy = async () => {
    if (selectedIndex == null) return
    const item = filtered[selectedIndex]
    if (!item) return
    const l = item.listing
    const kwh = Math.floor(Number(l.energy_amount) / 1000)
    const total = kwh * Number(l.price_per_kwh)
    if (!profileId.trim()) return
    await buyEnergy(l.id, profileId.trim(), total)
  }
  useEffect(() => {
    if (state.status === "confirmed" && selectedIndex != null) {
      const id = filtered[selectedIndex]?.listing.id
      if (id) {
        setPurchasedIds((prev) => new Set([...Array.from(prev), id]))
      }
      setConfirmOpen(false)
      setSelectedIndex(null)
      setNotify("Purchase confirmed")
      setTimeout(() => setNotify(null), 2500)
    }
  }, [state.status, selectedIndex, filtered])

  return (
    <div className="space-y-4">
      {notify && (
        <div className="px-4 py-2 rounded-lg border border-green-500/40 bg-green-600/20 text-sm">
          {notify}
        </div>
      )}
      {!MARKETPLACE_ID && (
        <div className="px-4 py-2 rounded-lg border border-yellow-500/40 bg-yellow-600/20 text-sm">
          Marketplace belum dikonfigurasi. Isi `MARKETPLACE_ID` di `lib/config.ts` agar transaksi berjalan.
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-white/70">Energy Type</div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value === "all" ? "all" : Number(e.target.value) as EnergyType)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 outline-none"
            >
              <option value="all">All</option>
              <option value={ENERGY_TYPES.SOLAR}>Solar</option>
              <option value={ENERGY_TYPES.WIND}>Wind</option>
              <option value={ENERGY_TYPES.HYDRO}>Hydro</option>
              <option value={ENERGY_TYPES.GRID}>Grid</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/70">Max Price (IOTA/kWh)</div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="flex-1"
              />
              <div className="text-xs">{priceRange[1]}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/70">Location</div>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-2 top-2.5 text-white/60" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City or lat,lng"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-700 border border-slate-600 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/70">Sort By</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "price_asc" | "distance" | "newest")}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 outline-none"
            >
              <option value="price_asc">Price (low to high)</option>
              <option value="distance">Distance</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isPending ? (
          <div className="col-span-full flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full space-y-4">
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <Filter className="w-6 h-6 text-white/60" />
              <div className="text-sm text-white/80">No listings found. Try creating one or explore samples below.</div>
            </div>
            {(() => {
              const samples = [
                { energy_type: ENERGY_TYPES.SOLAR, energy_amount: "5000", price_per_kwh: "2", location: "Bandung, ID", seller: "0xSAMPLE1" },
                { energy_type: ENERGY_TYPES.WIND, energy_amount: "8000", price_per_kwh: "3", location: "Yogyakarta, ID", seller: "0xSAMPLE2" },
                { energy_type: ENERGY_TYPES.HYDRO, energy_amount: "12000", price_per_kwh: "1", location: "Bogor, ID", seller: "0xSAMPLE3" },
              ]
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {samples.map((l, idx) => {
                    const Icon = l.energy_type === ENERGY_TYPES.SOLAR ? Sun : l.energy_type === ENERGY_TYPES.WIND ? Wind : Activity
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
                            Sample Listing
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        ) : (
          filtered.map((item, idx) => {
            const l = item.listing
            const Icon = getEnergyIcon(l.energy_type)
            const kwh = Number(l.energy_amount) / 1000
            const dist =
              item.distance === Number.POSITIVE_INFINITY ? "N/A" : `${item.distance.toFixed(1)} km`
            return (
              <div
                key={l.id}
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
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <div className="text-white/70">Amount</div>
                    <div className="font-semibold">{kwh.toFixed(2)} kWh</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-white/70">Price</div>
                    <div className="font-semibold">{Number(l.price_per_kwh)} IOTA/kWh</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-white/70">Location</div>
                    <div className="font-semibold">{l.location || "-"}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-white/70">Distance</div>
                    <div className="font-semibold">{dist}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => openConfirm(idx)}
                    className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 transition-all"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {confirmOpen && selectedIndex != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Confirm Purchase</div>
              <button onClick={closeConfirm} className="p-1 rounded hover:bg-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            {(() => {
              const l = filtered[selectedIndex].listing
              const kwh = Math.floor(Number(l.energy_amount) / 1000)
              const total = kwh * Number(l.price_per_kwh)
              return (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-white/70">Amount</div>
                    <div className="font-semibold">{kwh.toFixed(2)} kWh</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-white/70">Price per kWh</div>
                    <div className="font-semibold">{Number(l.price_per_kwh)} IOTA</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-white/70">Total</div>
                    <div className="font-semibold">{isNaN(total) ? "0.00" : total.toFixed(2)} IOTA</div>
                  </div>
                  <div className="mt-3">
                    <input
                      type="text"
                      value={profileId}
                      onChange={(e) => setProfileId(e.target.value)}
                      placeholder="Enter your profile object ID"
                      className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 outline-none"
                    />
                  </div>
                </div>
              )
            })()}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleBuy}
                disabled={isLoading || !profileId.trim() || profileLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Confirm</span>
              </button>
              <button onClick={closeConfirm} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { Marketplace }
