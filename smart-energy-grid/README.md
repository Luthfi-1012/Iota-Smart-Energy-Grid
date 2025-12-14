# Pizza Box
A simple IOTA dApp to understand about Move object concept with pizza and pizza box analogy.


## 📍 Contract Address

**Network**: Testnet
**Package ID**: `0x60cc7119c2418cd870138e9df1acd0f36bafd760a524b532575cdef1911d23cb`
**Explorer**: [View on Explorer](https://iotascan.com/testnet/object/0x60cc7119c2418cd870138e9df1acd0f36bafd760a524b532575cdef1911d23cb/contracts)

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 📝 Next Steps

### 1. Deploy Your Move Contract

```bash
cd contract/<your-project-name>
iota move build
iota client publish
```

Then manually copy the package ID and update `lib/config.ts`:

```typescript
export const TESTNET_PACKAGE_ID = "0xYOUR_PACKAGE_ID"
```

### 2. Customize Your dApp
- Adjust `Provider.tsx` for the default environment of your dApp.
- Adjust `useContracts.ts` for methods to interact with your contract. 
- Adjust `components/sample.tsx` to customize how your dApp looks.


## 🔧 Advanced Configuration

### Network Configuration

Edit `lib/config.ts` to configure different networks:

```typescript
export const TESTNET_PACKAGE_ID = "0x..."
export const DEVNET_PACKAGE_ID = "0x..."
export const MAINNET_PACKAGE_ID = "0x..."
```

## 📚 Additional Resources

- [IOTA Documentation](https://wiki.iota.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Move Language Documentation](https://move-language.github.io/move/)

