Contract Address/Packcage ID
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a3aaec1b-032b-4de6-b6f4-114684eb26be" />

Packcage ID (0x9187c7614b1f37c7dd40bda30af567a50eaac7f138b4988eb753c84748323552)

# ⚡ Iota Smart Energy Grid

> A decentralized energy trading platform powered by IOTA blockchain technology

[![IOTA](https://img.shields.io/badge/IOTA-Testnet-131F37?style=flat&logo=iota)](https://iota.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![DePIN](https://img.shields.io/badge/DePIN-Enabled-00D4AA?style=flat)](https://messari.io/report/state-of-depin-2023)

---

## 🌟 Overview

**Iota Smart Energy Grid** is a revolutionary DePIN (Decentralized Physical Infrastructure Networks) platform that transforms how we trade energy. Buy and sell energy directly with your neighbors or through a global marketplace—all powered by IOTA's fast, feeless blockchain technology.

### 💡 Why Choose Us?

- ⚡ **Lightning Fast** - Instant energy transactions with IOTA's superior finality
- 💰 **Low Costs** - Minimal transaction fees compared to traditional energy markets
- 🌍 **Two Trading Modes** - Global Marketplace or Local P2P trading
- 🔒 **Secure & Transparent** - Blockchain-backed transactions you can trust
- 📍 **Location-Smart** - Prioritizes nearby energy sources for efficiency

---

## 🎯 Key Features

### 👤 User Onboarding
- 🚀 **One-Click Connect** - Simple wallet connection to get started
- 🆔 **Auto Profile Creation** - Your profile is automatically created on first login
- 📊 **Dashboard Overview** - Track your energy production, consumption, and balance

### 📦 Energy Listings
- ✍️ **Create Listings** - List your excess energy with custom pricing
- 📍 **Geolocation Support** - Set your location for P2P recommendations
- 🏷️ **Flexible Pricing** - Set your price per kWh in IOTA tokens
- 🔋 **Energy Type Selection** - Specify solar, wind, hydro, or other sources

### 🛒 Smart Marketplace
- 🔍 **Advanced Filters** - Filter by energy type, price range, and location
- 📈 **Multiple Sorting** - Sort by price, distance, or newest listings
- 🎯 **P2P Recommendations** - Find the nearest energy sellers automatically
- ✅ **Real-time Updates** - Listings update instantly after purchase

### 💳 Transactions & History
- 💎 **IOTA Payments** - Seamless payments using IOTA Coin
- 📜 **Complete History** - Track all your energy purchases and sales
- 🔔 **Status Notifications** - Real-time transaction status updates
- 🧾 **Transparent Records** - All transactions stored on-chain

---

## 🏗️ Architecture

### 🧠 Data Layer
| Component | Description |
|-----------|-------------|
| **My Listings** | Uses `getOwnedObjects` to retrieve user's energy listings |
| **Global Marketplace** | Fetches `ListingCreated` events for real-time updates |
| **P2P System** | Haversine formula calculates nearest energy sources |
| **Location Storage** | Encoded as `vector<u8>` for efficient on-chain storage |

### 🎨 Frontend Pages
- 🏠 **Dashboard** - Energy production/consumption overview with visual indicators
- 💼 **Sell Energy** - Intuitive form for creating energy listings
- 🌐 **Marketplace** - Global energy trading hub with filters and sorting
- 🤝 **P2P Trading** - Local peer-to-peer energy exchange
- 📋 **My Listings** - Manage your active and sold listings
- 📊 **Transactions** - Complete transaction history

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- IOTA-compatible wallet

### 📥 Installation

1️⃣ **Clone the Repository**
```bash
git clone https://github.com/Luthfi-1012/Iota-Smart-Energy-Grid.git
cd Iota-Smart-Energy-Grid
```

2️⃣ **Install Dependencies**
```bash
npm install
```

3️⃣ **Start the Application**
```bash
npm start
```

4️⃣ **Open Your Browser**
```
Navigate to http://localhost:3000
```

---

## 📖 How to Use

### 🔌 Connect & Setup
1. Click **"Enter App"** on the landing page
2. Connect your IOTA-compatible wallet
3. Your profile will be created automatically ✨

### 💰 Sell Your Energy
1. Navigate to **"Sell Energy"** page
2. Fill in the form:
   - ⚡ Energy amount (Wh)
   - 💵 Price per kWh (IOTA)
   - 🔋 Energy type (Solar, Wind, etc.)
   - 📍 Your location
3. Click **"Create Listing"**
4. Confirm the transaction in your wallet

### 🛍️ Buy Energy
1. Choose **Marketplace** or **P2P** tab
2. Apply filters to find the perfect listing
3. Select a listing and click **"Buy"**
4. Review the calculated cost
5. Confirm the transaction
6. Done! The listing is now marked as **Sold** 🎉

### 📜 View History
- Check **"Transactions"** page for complete purchase history
- All transactions sorted by latest first
- View details: amount, price, timestamp, and status

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| ⛓️ **IOTA Blockchain** | Feeless, fast energy transactions |
| ⚛️ **React** | Modern, responsive user interface |
| 🔧 **IOTA Dapp Kit** | Blockchain interaction and wallet integration |
| 📍 **Geolocation API** | P2P peer recommendations |
| 🎨 **Tailwind CSS** | Beautiful, utility-first styling |

---

## 🌍 Why DePIN?

**Decentralized Physical Infrastructure Networks (DePIN)** represent the future of physical resource management:

- 🏘️ **Community Empowerment** - Trade directly with your neighbors
- 💚 **Sustainable Energy** - Promote renewable energy adoption
- 📉 **Lower Costs** - Eliminate middlemen and reduce fees
- 🔄 **Grid Efficiency** - Reduce transmission losses with local trading
- 🌱 **Green Future** - Support the transition to clean energy

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create a new branch (`git checkout -b feature/amazing-feature`)
3. 💻 Make your changes
4. ✅ Commit your changes (`git commit -m 'Add amazing feature'`)
5. 📤 Push to the branch (`git push origin feature/amazing-feature`)
6. 🎉 Open a Pull Request

### 📋 Contribution Ideas
- 🐛 Bug fixes and improvements
- ✨ New features and enhancements
- 📝 Documentation updates
- 🎨 UI/UX improvements
- 🧪 Test coverage

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Contact & Support

- 🌐 **Website**: [Coming Soon]
- 💬 **Discord**: [Join our community]
- 🐦 **Twitter**: [@IotaEnergyGrid]
- 📧 **Email**: support@iotaenergygrid.io

---

## 🙏 Acknowledgments

- Thanks to the IOTA Foundation for the amazing blockchain technology
- All contributors who helped make this project possible
- The DePIN community for inspiration and support

---

<div align="center">

### ⭐ Star us on GitHub — it helps!

**Made with ❤️ for a sustainable energy future**

[⬆ Back to Top](#-iota-smart-energy-grid)

</div>
