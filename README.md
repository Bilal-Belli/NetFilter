# <img src="img/logo.png" align="right" width="100" alt="NetFilter Logo"> NetFilter

> "Get away from bad sites, focus on what matters, and live naturally in peace."

**NetFilter** is a professional, high-performance browser extension developed to block access to distraction-heavy and harmful websites, helping you keep your focus and maintain a healthy digital life.

By preventing connections to unwanted sites before pages start resolving in your browser, NetFilter ensures a seamless, fast, and interruption-free browsing experience.

---
## Demo

https://github.com/user-attachments/assets/6d82e198-50a5-428f-a055-19bfb8f0592a

## 🚀 Key Features

* **Pre-Navigation Filtering:** Inspects navigation requests *before* they resolve to keep your browser fast, clean, and secure.
* **Default Protection:** Includes out-of-the-box blocks for **17,000+ domain hashes**.
* **Custom Blocklist:** Easily add and delete custom domains to suit your unique productivity and security requirements.
* **Activity Logs:** Locally records intercepted site attempts so you can review statistics and trends.
* **100% Privacy-Focused:** No cloud synchronization or central APIs. All data belongs to you and remains strictly on your hard drive.

---

## 🛠️ Installation & Setup

Since NetFilter runs locally to protect your privacy, you can load it directly into your browser:

1.  **Download/Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/NetFilter.git
    ```
2.  **Open Extension Management:**
    * For **Chrome/Edge/Brave**: Navigate to `chrome://extensions/`
    * For **Firefox**: Navigate to `about:debugging#/runtime/this-firefox`
3.  **Enable Developer Mode:** Toggle the "Developer mode" switch in the top-right corner.
4.  **Load Unpacked:** Click **Load unpacked** and select the root directory of the cloned NetFilter repository.

---

## 📈 How It Works

NetFilter hooks into your browser's web request lifecycle. Before a domain resolves, the extension hashes the destination and cross-references it with its lightning-fast local list of 17,000+ blocked hashes, preventing any network connection from being established to blacklisted sites.

---

## 📬 Update Requests & Feedback

We actively maintain the default blocklist to keep up with the changing web. 

* **Requesting Additions/Removals:** To request new sites to be added to or removed from the default blocklist, please [Open an Issue](https://github.com/your-username/NetFilter/issues)
* **SLA:** Requests are typically processed and merged within **48 hours**.

---

## 🔒 Privacy Policy

Your privacy is our priority. NetFilter does not track, store, or transmit your browsing history, personal data, or usage metrics. Everything is stored locally on your machine.

---

## 👤 Author

* **Developer:** Mr. Bilal Belli

---

*Version 1.0.0 • Developed with ❤️ for a distraction-free web.*
