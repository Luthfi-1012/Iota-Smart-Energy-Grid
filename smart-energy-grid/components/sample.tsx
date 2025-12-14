"use client"

/**
 * ============================================================================
 * IOTA DAPP INTEGRATION COMPONENT
 * ============================================================================
 *
 * This is the main integration component for your IOTA dApp.
 *
 * All the contract logic is in hooks/useContract.ts
 *
 * To customize your dApp, modify this file.
 *
 * ============================================================================
 */

import { ConnectModal, useCurrentAccount, useCurrentWallet, useDisconnectWallet } from "@iota/dapp-kit"
import { useContract } from "@/hooks/useContract"
import { Button, Text, TextField } from "@radix-ui/themes"
import ClipLoader from "react-spinners/ClipLoader"
import { useState, useMemo } from "react"

const SampleIntegration = () => {
  const currentAccount = useCurrentAccount()
  const { mutate: disconnectWallet } = useDisconnectWallet()
  const { data, actions, state, objectId, isOwner, objectExists, hasValidData } = useContract()

  // Pizza toppings state (matching contract: pepperoni, sausage, cheese, onion, chives)
  const [pepperoni, setPepperoni] = useState("")
  const [sausage, setSausage] = useState("")
  const [cheese, setCheese] = useState("")
  const [onion, setOnion] = useState("")
  const [chives, setChives] = useState("")
  const [pizzaboxId, setPizzaboxId] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  const isConnected = !!currentAccount

  // Generate random positions for toppings (seeded by count for consistency)
  const generateToppingPositions = (count: number, seed: number) => {
    const positions: { x: number; y: number; r: number }[] = []
    for (let i = 0; i < Math.min(count, 30); i++) {
      // Use seed + index to get consistent "random" positions
      const angle = ((seed * 137.5 + i * 47) % 360) * (Math.PI / 180)
      const radius = 20 + ((seed * 13 + i * 17) % 45)
      const x = 100 + Math.cos(angle) * radius
      const y = 100 + Math.sin(angle) * radius
      const r = 6 + (i % 3) * 2
      positions.push({ x, y, r })
    }
    return positions
  }

  // Memoize topping positions based on current values
  const toppingPositions = useMemo(() => ({
    pepperoni: generateToppingPositions(Number(pepperoni) || 0, 1),
    sausage: generateToppingPositions(Number(sausage) || 0, 2),
    cheese: generateToppingPositions(Number(cheese) || 0, 3),
    onion: generateToppingPositions(Number(onion) || 0, 4),
    chives: generateToppingPositions(Number(chives) || 0, 5),
  }), [pepperoni, sausage, cheese, onion, chives])

  // Dynamic Pizza SVG that shows toppings based on input
  const DynamicPizzaSVG = () => (
    <svg width="320" height="320" viewBox="0 0 200 200" style={{
      animation: "spin 20s linear infinite"
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Pizza base/crust */}
      <circle cx="100" cy="100" r="95" fill="#E8B86D" />
      {/* Sauce layer */}
      <circle cx="100" cy="100" r="78" fill="#E53935" />
      {/* Cheese base layer */}
      <circle cx="100" cy="100" r="72" fill="#FFCA28" />

      {/* Extra cheese blobs */}
      {toppingPositions.cheese.map((pos, i) => (
        <g key={`cheese-${i}`}>
          <circle cx={pos.x} cy={pos.y} r={pos.r + 2} fill="#FFE082" opacity="0.85" />
          {/* Orange hint detail */}
          <circle cx={pos.x + 2} cy={pos.y - 1} r={pos.r - 2} fill="#FFB74D" opacity="0.6" />
        </g>
      ))}

      {/* Pepperoni slices */}
      {toppingPositions.pepperoni.map((pos, i) => (
        <circle key={`pepperoni-${i}`} cx={pos.x} cy={pos.y} r={pos.r} fill="#C62828" />
      ))}

      {/* Sausage pieces */}
      {toppingPositions.sausage.map((pos, i) => (
        <g key={`sausage-${i}`} transform={`rotate(${i * 45} ${pos.x} ${pos.y})`}>
          {/* Base sausage */}
          <ellipse cx={pos.x} cy={pos.y} rx={pos.r + 1} ry={pos.r - 1} fill="#8D6E63" />
          {/* Reddish brown detail */}
          <ellipse cx={pos.x - 1} cy={pos.y} rx={pos.r - 2} ry={pos.r - 3} fill="#A1887F" opacity="0.7" />
          <circle cx={pos.x + 2} cy={pos.y - 1} r="2" fill="#6D4C41" opacity="0.5" />
        </g>
      ))}

      {/* Onion rings */}
      {toppingPositions.onion.map((pos, i) => (
        <circle key={`onion-${i}`} cx={pos.x} cy={pos.y} r={pos.r - 1} fill="none" stroke="#E8E8E8" strokeWidth="2" />
      ))}

      {/* Chives */}
      {toppingPositions.chives.map((pos, i) => (
        <ellipse key={`chives-${i}`} cx={pos.x} cy={pos.y} rx="2" ry={pos.r} fill="#43A047" transform={`rotate(${i * 30} ${pos.x} ${pos.y})`} />
      ))}
    </svg>
  )

  // Static Hero Pizza SVG
  const HeroPizzaSVG = () => (
    <svg width="280" height="280" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="95" fill="#E8B86D" />
      <circle cx="100" cy="100" r="78" fill="#E53935" />
      <circle cx="100" cy="100" r="72" fill="#FFCA28" />
      <circle cx="70" cy="65" r="14" fill="#C62828" />
      <circle cx="130" cy="75" r="14" fill="#C62828" />
      <circle cx="85" cy="120" r="14" fill="#C62828" />
      <circle cx="125" cy="130" r="14" fill="#C62828" />
      <circle cx="100" cy="90" r="11" fill="#C62828" />
      <ellipse cx="55" cy="100" rx="7" ry="12" fill="#43A047" transform="rotate(-30 55 100)" />
      <ellipse cx="145" cy="105" rx="7" ry="12" fill="#43A047" transform="rotate(25 145 105)" />
      <ellipse cx="105" cy="145" rx="7" ry="12" fill="#43A047" transform="rotate(10 105 145)" />
    </svg>
  )

  // Pizza Box SVG
  const PizzaBoxSVG = () => (
    <svg width="320" height="320" viewBox="0 0 200 200">
      {/* Box shadow */}
      <ellipse cx="100" cy="175" rx="70" ry="8" fill="#333" opacity="0.2" />

      {/* Box bottom part */}
      <rect x="30" y="100" width="140" height="70" fill="#D4A574" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box front face - lighter */}
      <polygon points="30,100 170,100 165,95 35,95" fill="#E8B86D" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box side details */}
      <line x1="30" y1="100" x2="30" y2="170" stroke="#8B5E3C" strokeWidth="1.5" />
      <line x1="170" y1="100" x2="170" y2="170" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box lid - top */}
      <rect x="25" y="45" width="150" height="50" fill="#C89968" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box lid - front edge (slightly open) */}
      <polygon points="25,95 175,95 170,100 30,100" fill="#E8B86D" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box lid - side shading */}
      <polygon points="175,45 175,95 170,100 165,95 165,50" fill="#B8845A" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Steam coming out */}
      <g opacity="0.6">
        <path d="M 80 85 Q 75 70 78 55" stroke="#E0E0E0" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M 100 85 Q 100 65 105 45" stroke="#E0E0E0" strokeWidth="3" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
        </path>
        <path d="M 120 85 Q 125 70 122 55" stroke="#E0E0E0" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.2s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Logo/Text on box */}
      <text x="100" y="70" textAnchor="middle" fill="#E53935" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">
        PIZZA
      </text>
      <text x="100" y="85" textAnchor="middle" fill="#43A047" fontSize="10" fontWeight="600" fontFamily="Arial, sans-serif">
        Fresh & Hot
      </text>

      {/* Box details/lines */}
      <line x1="35" y1="110" x2="165" y2="110" stroke="#8B5E3C" strokeWidth="0.5" opacity="0.5" />
      <line x1="35" y1="130" x2="165" y2="130" stroke="#8B5E3C" strokeWidth="0.5" opacity="0.5" />
      <line x1="35" y1="150" x2="165" y2="150" stroke="#8B5E3C" strokeWidth="0.5" opacity="0.5" />
    </svg>
  )

  // Handle input change with 0-30 constraint
  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setter("")
      return
    }
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0 && num <= 30) {
      setter(value)
    }
  }

  // Disconnected state - Hero landing page
  if (!isConnected) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#FFF8E1",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "8%", left: "5%", width: "80px", height: "80px", borderRadius: "50%", background: "#FFCA28", opacity: 0.4 }} />
        <div style={{ position: "absolute", top: "20%", right: "8%", width: "50px", height: "50px", borderRadius: "50%", background: "#43A047", opacity: 0.3 }} />
        <div style={{ position: "absolute", bottom: "25%", left: "10%", width: "40px", height: "40px", borderRadius: "50%", background: "#E53935", opacity: 0.25 }} />
        <div style={{ position: "absolute", bottom: "15%", right: "12%", width: "60px", height: "60px", borderRadius: "50%", background: "#FFCA28", opacity: 0.35 }} />

        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "800px",
            width: "100%",
            gap: "1.5rem"
          }}>
            <div style={{ textAlign: "center" }}>
              <h1 style={{
                fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                fontWeight: "800",
                color: "#E53935",
                margin: 0,
                lineHeight: 1.1
              }}>
                Pack a Pizza
              </h1>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "4px"
              }}>
                <span style={{
                  color: "#43A047",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  letterSpacing: "1px"
                }}>
                  POWERED BY IOTA
                </span>
              </div>
            </div>

            <div style={{ margin: "0.5rem 0" }}>
              <HeroPizzaSVG />
            </div>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.75rem"
            }}>
              {[
                { text: "Cook Pizzas", bg: "#E53935" },
                { text: "Pack & Store", bg: "#43A047" },
                { text: "Earn Rewards", bg: "#E8B86D" }
              ].map((item, i) => (
                <div key={i} style={{
                  background: item.bg,
                  padding: "0.5rem 1rem",
                  borderRadius: "30px"
                }}>
                  <span style={{ fontWeight: "600", color: "white", fontSize: "0.9rem" }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={{
              padding: "0.5rem 0.5rem",
              borderRadius: "8px",
              textAlign: "center",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem"
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#43A047" }} />
                <span style={{ color: "#43A047", fontWeight: "600", fontSize: "0.85rem" }}>Ready to cook?</span>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    background: "#43A047",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "30px",
                    border: "none",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Connect Wallet
                </button>
                <ConnectModal
                  trigger={<span />}
                  open={modalOpen}
                  onOpenChange={(isOpen) => setModalOpen(isOpen)}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", height: "20px" }}>
          <div style={{ flex: 1, background: "#43A047" }} />
          <div style={{ flex: 1, background: "#E53935" }} />
          <div style={{ flex: 1, background: "#43A047" }} />
        </div>
      </div>
    )
  }

  const handleCook = () => {
    const values = [pepperoni, sausage, cheese, onion, chives]
    if (values.every(v => v !== "" && !isNaN(Number(v)))) {
      actions.cook(
        Number(pepperoni),
        Number(sausage),
        Number(cheese),
        Number(onion),
        Number(chives)
      )
    }
  }

  // Connected state - Pizza builder
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#FFF8E1",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative shapes */}
      <div style={{ position: "absolute", top: "8%", left: "5%", width: "80px", height: "80px", borderRadius: "50%", background: "#FFCA28", opacity: 0.4 }} />
      <div style={{ position: "absolute", top: "20%", right: "8%", width: "50px", height: "50px", borderRadius: "50%", background: "#43A047", opacity: 0.3 }} />
      <div style={{ position: "absolute", bottom: "25%", left: "10%", width: "40px", height: "40px", borderRadius: "50%", background: "#E53935", opacity: 0.25 }} />
      <div style={{ position: "absolute", bottom: "15%", right: "12%", width: "60px", height: "60px", borderRadius: "50%", background: "#FFCA28", opacity: 0.35 }} />

      {/* Header */}
      <div style={{
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        zIndex: 1
      }}>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: "800",
          color: "#E53935",
          margin: 0
        }}>
          Pack a Pizza
        </h1>
        <span style={{
          color: "#43A047",
          fontSize: "0.75rem",
          fontWeight: "600",
          letterSpacing: "1px"
        }}>
          POWERED BY IOTA
        </span>
        <button
          onClick={() => disconnectWallet()}
          style={{
            background: "#43A047",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "30px",
            border: "none",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {`Disconnect (${currentAccount?.address.slice(0, 6)}...${currentAccount?.address.slice(-4)})`}
        </button>
        <ConnectModal
          trigger={<span />}
          open={modalOpen}
          onOpenChange={(isOpen) => setModalOpen(isOpen)}
        />
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem 2rem",
        position: "relative",
        zIndex: 1
      }}>
        {!objectId ? (
          // Pizza Builder - 2 Column Layout
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            maxWidth: "900px",
            width: "100%",
            alignItems: "center"
          }}>
            {/* Left Column - Form */}
            <div style={{
              background: "white",
              padding: "2rem",
              borderRadius: "16px",
              border: "2px solid #E53935"
            }}>
              <h2 style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#333",
                margin: "0 0 1.5rem 0"
              }}>
                Build Your Pizza
              </h2>

              {/* Topping Inputs */}
              {[
                { label: "Pepperoni", value: pepperoni, setter: setPepperoni, color: "#C62828" },
                { label: "Sausage", value: sausage, setter: setSausage, color: "#8D6E63" },
                { label: "Cheese", value: cheese, setter: setCheese, color: "#FFCA28" },
                { label: "Onion", value: onion, setter: setOnion, color: "#9E9E9E" },
                { label: "Chives", value: chives, setter: setChives, color: "#43A047" }
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: "1rem" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem"
                  }}>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: item.color
                    }} />
                    <Text size="2" style={{ fontWeight: "600", color: "#333" }}>{item.label}</Text>
                    <Text size="1" style={{ color: "#999" }}>(0-30)</Text>
                  </div>
                  <TextField.Root
                    value={item.value}
                    onChange={handleInputChange(item.setter)}
                    placeholder="0"
                    type="number"
                    min="0"
                    max="30"
                    style={{ width: "100%" }}
                  />
                </div>
              ))}

              <button
                onClick={handleCook}
                disabled={state.isPending || [pepperoni, sausage, cheese, onion, chives].some(v => v === "" || isNaN(Number(v)))}
                style={{
                  width: "100%",
                  background: state.isPending ? "#999" : "#E53935",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "30px",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "1rem",
                  cursor: state.isPending ? "not-allowed" : "pointer",
                  marginTop: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {state.isPending ? (
                  <>
                    <ClipLoader size={16} color="white" />
                    Cooking...
                  </>
                ) : (
                  "Cook & Pack"
                )}
              </button>

              {state.error && (
                <div style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "#FFEBEE",
                  borderRadius: "8px",
                  border: "1px solid #E53935"
                }}>
                  <Text size="2" style={{ color: "#C62828" }}>
                    {(state.error as Error)?.message || String(state.error)}
                  </Text>
                </div>
              )}
            </div>

            {/* Right Column - Pizza Preview */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "420px",
              position: "relative"
            }}>
              {/* Pizza container - fixed position */}
              <div style={{
                position: "absolute",
                top: "42%",
                left: "50%",
                transform: "translate(-50%, -50%)"
              }}>
                <DynamicPizzaSVG />
              </div>
              {/* Topping pills - fixed at bottom */}
              <div style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "0.5rem",
                minHeight: "30px"
              }}>
                {[
                  { label: "Pepperoni", count: pepperoni, color: "#C62828" },
                  { label: "Sausage", count: sausage, color: "#8D6E63" },
                  { label: "Cheese", count: cheese, color: "#FFCA28" },
                  { label: "Onion", count: onion, color: "#9E9E9E" },
                  { label: "Chives", count: chives, color: "#43A047" }
                ].filter(item => Number(item.count) > 0).map((item, i) => (
                  <div key={i} style={{
                    background: item.color,
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}>
                    <span style={{ color: "white", fontSize: "0.75rem", fontWeight: "600" }}>
                      {item.label}: {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Pizza Box Created View
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            maxWidth: "900px",
            width: "100%",
            alignItems: "center"
          }}>
            {/* Left Column - Info */}
            <div style={{
              background: "white",
              padding: "2rem",
              borderRadius: "16px",
              border: "2px solid #43A047"
            }}>
              {state.isLoading && !data ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <ClipLoader size={32} color="#43A047" />
                  <Text style={{ display: "block", marginTop: "1rem", color: "#666" }}>Loading PizzaBox...</Text>
                </div>
              ) : state.error ? (
                <div>
                  <h2 style={{ color: "#C62828", margin: "0 0 1rem 0" }}>Error Loading PizzaBox</h2>
                  <Text size="2" style={{ color: "#666", display: "block", marginBottom: "1rem" }}>
                    {state.error.message || "Object not found or invalid"}
                  </Text>
                  <Text size="1" style={{ color: "#999", display: "block", marginBottom: "1rem", wordBreak: "break-all" }}>
                    ID: {objectId}
                  </Text>
                  <button
                    onClick={actions.clearObject}
                    style={{
                      background: "#E53935",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "30px",
                      border: "none",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Cook New Pizza
                  </button>
                </div>
              ) : data ? (
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem"
                  }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#43A047" }} />
                    <h2 style={{ margin: 0, color: "#43A047", fontSize: "1.25rem", fontWeight: "600" }}>Pizza delivered!</h2>
                  </div>

                  <div style={{
                    background: "#F5F5F5",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1rem"
                  }}>
                    <Text size="1" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>Object ID</Text>
                    <Text size="2" style={{ color: "#333", wordBreak: "break-all", fontFamily: "monospace" }}>{objectId}</Text>
                  </div>

                  <div style={{
                    background: "#F5F5F5",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1rem"
                  }}>
                    <Text size="1" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>Owner</Text>
                    <Text size="2" style={{ color: "#333", wordBreak: "break-all", fontFamily: "monospace" }}>{data.owner}</Text>
                  </div>

                  {isOwner && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <button
                        onClick={actions.clearObject}
                        style={{
                          background: "transparent",
                          color: "#E53935",
                          padding: "0.5rem 1rem",
                          borderRadius: "30px",
                          border: "2px solid #E53935",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cook New
                      </button>
                    </div>
                  )}

                  {state.hash && (
                    <div style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      background: state.isConfirmed ? "#E8F5E9" : "#FFF8E1",
                      borderRadius: "8px",
                      border: `1px solid ${state.isConfirmed ? "#43A047" : "#FFCA28"}`
                    }}>
                      <Text size="1" style={{ display: "block", marginBottom: "0.5rem", color: "#666" }}>Transaction Hash</Text>
                      <Text size="2" style={{ fontFamily: "monospace", wordBreak: "break-all", color: "#333" }}>{state.hash}</Text>
                      {state.isConfirmed && (
                        <Text size="2" style={{ color: "#43A047", marginTop: "0.5rem", display: "block", fontWeight: "600" }}>
                          Confirmed!
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 style={{ color: "#F9A825", margin: "0 0 1rem 0" }}>PizzaBox Not Found</h2>
                  <Text size="1" style={{ color: "#999", display: "block", marginBottom: "1rem", wordBreak: "break-all" }}>
                    ID: {objectId}
                  </Text>
                  <button
                    onClick={actions.clearObject}
                    style={{
                      background: "#E53935",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "30px",
                      border: "none",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Cook New Pizza
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Pizza Box Visual */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem"
            }}>
              <PizzaBoxSVG />
              <div style={{
                background: "#43A047",
                padding: "0.5rem 1.5rem",
                borderRadius: "30px"
              }}>
                <span style={{ color: "white", fontWeight: "600" }}>Packed & Ready!</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer stripe */}
      <div style={{ display: "flex", height: "20px" }}>
        <div style={{ flex: 1, background: "#43A047" }} />
        <div style={{ flex: 1, background: "#E53935" }} />
        <div style={{ flex: 1, background: "#43A047" }} />
      </div>
    </div>
  )
}

export default SampleIntegration
