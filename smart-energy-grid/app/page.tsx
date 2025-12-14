"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ConnectButton, ConnectModal, useCurrentAccount } from "@iota/dapp-kit"
import { Zap, ShieldCheck, ArrowRight, Leaf, Wallet, Globe2 } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const currentAccount = useCurrentAccount()
  const [modalOpen, setModalOpen] = useState(false)
  const previews = [
    {
      title: "Energi Bersih",
      subtitle: "Perdagangan energi masa depan",
      image:
        "https://images.unsplash.com/photo-1503437313881-503a91226422?q=80&w=1200&auto=format&fit=crop",
      badge1: "Listings Live",
      badge2: "P2P Nearby",
      badge3: "Fees 1%",
    },
    {
      title: "Surplus ke Tetangga",
      subtitle: "Jual ke peer terdekat",
      image:
        "https://images.unsplash.com/photo-1584270354949-1f51a2f98755?q=80&w=1200&auto=format&fit=crop",
      badge1: "Green Energy",
      badge2: "Low Cost",
      badge3: "Fast Finality",
    },
    {
      title: "Smart Grid",
      subtitle: "Transparan, cepat, aman",
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop",
      badge1: "IOTA",
      badge2: "Move",
      badge3: "DePIN",
    },
  ]
  const [previewIndex, setPreviewIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setPreviewIndex((i) => (i + 1) % previews.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (currentAccount) router.push("/grid")
  }, [currentAccount, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="relative px-4 sm:px-6 py-10 sm:py-16 max-w-7xl mx-auto">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Powered by IOTA</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Smart Energy Grid
            </h1>
            <p className="text-white/80 text-sm sm:text-base max-w-xl">
              Platform perdagangan energi peer‑to‑peer di atas IOTA. Buat listing energi, beli listrik dari tetangga,
              dan nikmati biaya rendah serta konfirmasi cepat.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 transition-all"
              >
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="inline-flex">
                <ConnectButton />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Leaf className="w-4 h-4 text-green-400" />
                  <div className="text-sm font-semibold">P2P & Berkelanjutan</div>
                </div>
                <div className="text-xs text-white/70">Jual/beli energi terbarukan langsung antar pengguna.</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <div className="text-sm font-semibold">Keamanan IOTA</div>
                </div>
                <div className="text-xs text-white/70">Transaksi aman, finalitas cepat, biaya rendah.</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <div className="text-sm font-semibold">Dompet Terintegrasi</div>
                </div>
                <div className="text-xs text-white/70">Hubungkan dompet saat siap bertransaksi.</div>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Preview</span>
                <Globe2 className="w-4 h-4 text-blue-400" />
              </div>
              <div
                className="mt-3 h-64 rounded-xl border border-slate-700 overflow-hidden relative"
                style={{
                  backgroundImage: `url(${previews[previewIndex].image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  transition: "background-image 0.6s ease-in-out",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-900/30 to-slate-900/10 backdrop-blur-[2px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">{previews[previewIndex].title}</div>
                    <div className="text-xs text-white/80">{previews[previewIndex].subtitle}</div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2">
                  <div className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-center">
                    <div className="text-xs text-white/70">{previews[previewIndex].badge1.split(" ")[0]}</div>
                    <div className="text-sm font-semibold">{previews[previewIndex].badge1.split(" ").slice(1).join(" ")}</div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-center">
                    <div className="text-xs text-white/70">{previews[previewIndex].badge2.split(" ")[0]}</div>
                    <div className="text-sm font-semibold">{previews[previewIndex].badge2.split(" ").slice(1).join(" ")}</div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-center">
                    <div className="text-xs text-white/70">{previews[previewIndex].badge3.split(" ")[0]}</div>
                    <div className="text-sm font-semibold">{previews[previewIndex].badge3.split(" ").slice(1).join(" ")}</div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  {previews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === previewIndex ? "bg-blue-400" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ConnectModal trigger={<span />} open={modalOpen} onOpenChange={(isOpen) => setModalOpen(isOpen)} />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <div className="text-sm font-semibold mb-1">Cara Kerja</div>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 inline-flex items-center justify-center">1</span> Hubungkan dompet IOTA</div>
              <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 inline-flex items-center justify-center">2</span> Buat profil energi Anda</div>
              <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 inline-flex items-center justify-center">3</span> Buat listing atau beli energi</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <div className="text-sm font-semibold mb-1">Keunggulan</div>
            <ul className="text-xs text-white/70 space-y-1">
              <li>Biaya platform rendah: 1%</li>
              <li>Konfirmasi cepat & transparan</li>
              <li>P2P langsung antar pengguna terdekat</li>
              <li>Mendukung energi terbarukan</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <div className="text-sm font-semibold mb-1">Statistik</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="px-2 py-2 rounded-lg bg-slate-700/40 border border-slate-600">
                <div className="text-xs text-white/70">Users</div>
                <div className="text-sm font-semibold">Live</div>
              </div>
              <div className="px-2 py-2 rounded-lg bg-slate-700/40 border border-slate-600">
                <div className="text-xs text-white/70">Listings</div>
                <div className="text-sm font-semibold">Active</div>
              </div>
              <div className="px-2 py-2 rounded-lg bg-slate-700/40 border border-slate-600">
                <div className="text-xs text-white/70">Volume</div>
                <div className="text-sm font-semibold">Growing</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center text-xs text-white/60">
          © {new Date().getFullYear()} IOTA Smart Energy Grid — Bangun ekonomi energi terdesentralisasi
        </div>
      </div>
    </main>
  )
}
