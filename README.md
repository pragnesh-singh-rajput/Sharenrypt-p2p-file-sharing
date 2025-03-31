# 🔒 Sharencrypt - Secure Peer-to-Peer File Sharing

This project demonstrates how to establish reliable peer-to-peer connections **without WebRTC**, using a **custom relay server** approach. 🚀

---

## ✨ Features

✅ **Direct communication** between two or more users  
✅ **Secure data transfer** with end-to-end encryption 🔐  
✅ **Cross-browser & cross-platform** compatibility 🌍  
✅ **NAT/firewall traversal** through relay servers 🏗️  
✅ **Automatic reconnection & fallback mechanisms** 🔄  
✅ **File transfer with progress tracking** 📂📊  

---

## 🏗️ Architecture

This solution employs a **hybrid approach**:

1️⃣ **Relay Server**: A WebSocket server facilitating communication between peers  
2️⃣ **Client Library**: A JavaScript library handling connections, encryption, and data transfer  
3️⃣ **Fallback Mechanisms**: Automatic reconnection & error handling to ensure a smooth experience 🔄  

---

## 🚀 Getting Started

### 🔧 Prerequisites

- 📌 Node.js **14.x** or higher  
- 📌 **npm** or **yarn** installed  

### 📥 Installation

1️⃣ Clone the repository:
   ```bash
   git clone https://github.com/your-repo/sharencrypt.git
   cd sharencrypt
   ```

2️⃣ Install dependencies:
   ```bash
   npm install
   ```

3️⃣ Start the relay server:
   ```bash
   npm run start-relay
   ```

4️⃣ Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔄 How It Works

### 🔗 Connection Establishment

1️⃣ Both peers **connect** to the relay server via WebSockets 🌐  
2️⃣ **Peer A** initiates a connection request to **Peer B** via the relay server 📩  
3️⃣ **Peer B** accepts the request ✅  
4️⃣ Both peers can now exchange data **securely** through the relay server 🔒  

### 📤 Data Transfer

🔹 Data is **encrypted** on the sender’s side using **AES-GCM** 🔐  
🔹 **Encrypted data** is split into **chunks** and sent through the relay server 📦  
🔹 The receiver **reassembles** and **decrypts** the data 🔓  
🔹 Large files are transferred with **progress tracking** 📊  

---

## 🛡️ Security

🔒 **End-to-End Encryption** with AES-GCM  
🔑 **Unique Encryption Keys** for each session  
🚫 **No Data Storage** on the relay server  

---

## 🌍 Deployment

### 📡 Relay Server

Deploy the relay server to any **Node.js hosting platform**:

✅ **Heroku**:
   ```bash
   heroku create
   git push heroku main
   ```

✅ **DigitalOcean**:
   Deploy using **App Platform** or a **Droplet** 🖥️  

✅ **AWS**:
   Deploy to **EC2**, **Elastic Beanstalk**, or **Lambda with API Gateway** ☁️  

### 🖥️ Client Application

Deploy the client application to any **static hosting service**:

✅ **Netlify**:
   ```bash
   npm run build
   netlify deploy
   ```

✅ **Vercel**:
   ```bash
   npm run build
   vercel
   ```

---

## ⚡ Performance Considerations

🚀 **Bandwidth**: The relay server requires **sufficient bandwidth** to handle all connections  
⏳ **Latency**: Using a relay server **adds some delay** compared to direct WebRTC connections  
📈 **Scalability**: For **large-scale deployments**, consider using **multiple relay servers** with load balancing  

---

## ⚠️ Limitations

❌ **Higher latency** compared to WebRTC ⚡  
❌ **Increased server costs** due to relay traffic 💸  
❌ **No UDP support** (TCP only) 🛑  
❌ **No direct peer-to-peer connections** 🔗🚫  

---

## 📜 License

This project is licensed under the **GNU 3.0 & MIT License** 📜 - see the [LICENSE-GNU](./LICENSE-GNU) **&** [LICENSE-MIT](./LICENSE-MIT) file for details.

---

## 👥 Authors

### Vishvam Joshi  
[![GitHub](https://img.shields.io/badge/GitHub-000?logo=github&logoColor=white)](https://github.com/vishvam12a)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?logo=linkedin&logoColor=white)](https://linkedin.com/in/vishvam-j-joshi) 
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?logo=instagram&logoColor=white)](https://instagram.com/vishvam.joshi.71)

### Pragnesh Singh  
[![GitHub](https://img.shields.io/badge/GitHub-000?logo=github&logoColor=white)](https://github.com/pragnesh-singh-rajput)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?logo=linkedin&logoColor=white)](https://linkedin.com/in/pragnesh-singh-rajput) 
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?logo=instagram&logoColor=white)](https://instagram.com/pragnesh_singh_rajput)

### Hardik Singh  
[![GitHub](https://img.shields.io/badge/GitHub-000?logo=github&logoColor=white)](https://github.com/singhhardik531)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?logo=linkedin&logoColor=white)](https://linkedin.com/in/hardik--singh) 
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?logo=instagram&logoColor=white)](https://instagram.com/imhardiksinghh)

