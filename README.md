# Allmiibo Web Manager & Vault (Gestor Web Allmiibo)

🌐 **Sitio Web Oficial / Live Web App**: 👉 <a href="https://allmiibo.aolabs.cl/" target="_blank" rel="noopener noreferrer"><strong>https://allmiibo.aolabs.cl/</strong></a>  
🏢 **AO Labs Chile**: 👉 <a href="https://aolabs.cl/" target="_blank" rel="noopener noreferrer"><strong>https://aolabs.cl/</strong></a>  
☕ **Apoyar el proyecto / Support on Ko-fi**: 👉 <a href="https://ko-fi.com/aolabs" target="_blank" rel="noopener noreferrer"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Buy Me a Coffee at ko-fi.com" height="28" style="vertical-align: middle;"></a>

[**Español**](#español) | [**English**](#english) | [**Donar / Donate**](#-apoyar-el-proyecto--support-the-project)

---

# Español

Un gestor web moderno, intuitivo y responsivo para administrar archivos Amiibo en dispositivos **Allmiibo** / **Pixl.js** a través de **Web Bluetooth (Web BLE)**. Permite la transferencia inalámbrica de archivos, organización automática de carpetas, actualización de firmware por DFU y descarga automática de claves de cifrado directamente desde el navegador sin instalar aplicaciones adicionales ni usar cables.

👉 **Enlace de acceso a la web**: <a href="https://allmiibo.aolabs.cl/" target="_blank" rel="noopener noreferrer">https://allmiibo.aolabs.cl/</a>  
🐙 **Repositorio en GitHub**: <a href="https://github.com/AO-Labs-Chile/allmiibo-manager" target="_blank" rel="noopener noreferrer">https://github.com/AO-Labs-Chile/allmiibo-manager</a>

> [!IMPORTANT]
> **Compatibilidad**: Web Bluetooth funciona de forma nativa en navegadores basados en Chromium (Google Chrome, Microsoft Edge, Opera o Brave). Para dispositivos móviles iOS (iPhone/iPad), debes abrir la web dentro de la app gratuita **Bluefy (Web BLE Browser)** disponible en la App Store. En Android, asegúrate de activar el Bluetooth y la Ubicación (GPS).

---

## 🚀 Características Principales

*   **Catálogo Online Integrado (Internet Archive Vault)**: Explora cientos de Amiibos organizados por franquicias y subseries (ej. *Animal Crossing: Series 1 a 5, Sanrio, Amiibo Festival*, *The Legend of Zelda*, *Splatoon*, *Super Smash Bros*, etc.) con sus imágenes oficiales.
*   **Flasheo Inalámbrico Directo**: Instala Amiibos directamente desde el catálogo online a la memoria de tu Allmiibo en segundo plano con un solo clic.
*   **Organización Automática de Carpetas**: Al instalar series completas o grupos de tarjetas, el sistema desglosa de forma inteligente las subseries en carpetas compatibles con el hardware (ej. `Zelda_BotW`, `Zelda_TotK`, `AC_Series_1`), evitando exceder los límites de longitud de ruta de LittleFS.
*   **Borrado Seguro de Amiibos**: Opción que elimina únicamente los Amiibos del dispositivo protegiendo de forma permanente la clave `key_retail.bin` y tus partidas guardadas (`E:/amiibo/save`).
*   **Auto-instalación de Claves (`key_retail.bin`)**: Descarga con un solo clic el archivo criptográfico oficial de 160 bytes directamente desde la bóveda de Internet Archive y lo instala en la raíz de tu Allmiibo, habilitando la base de datos interna.
*   **Reinicio Inalámbrico a Modo DFU**: Envía la orden directa por Bluetooth para reiniciar el Allmiibo en modo *Device Firmware Update (DFU)* de forma automática para actualizar el firmware oficial de solosky.
*   **Explorador Local y Galería Visual**: Modo de exploración con conteo de elementos y galería visual que muestra las figuras instaladas con sus portadas oficiales dinámicas de <a href="https://www.amiiboapi.org/" target="_blank" rel="noopener noreferrer">AmiiboAPI</a>.
*   **Diseño Moderno y Responsivo con Menú Móvil**: Interfaz optimizada con modo oscuro Slate, logotipo de alta resolución y menú desplegable responsivo (3 líneas) para pantallas móviles.
*   **Simulador Virtual Integrado**: Permite probar todas las funciones de la interfaz en un entorno virtual sin necesidad de conectar un dispositivo físico.

---

## 🛠️ Guía de Uso

1.  Abre la aplicación web en <a href="https://allmiibo.aolabs.cl/" target="_blank" rel="noopener noreferrer">https://allmiibo.aolabs.cl/</a>.
2.  Haz clic en **Conectar Allmiibo** (asegúrate de tener el Bluetooth activado).
3.  Selecciona tu Allmiibo en la ventana emergente de emparejamiento.
4.  Si es tu primera vez:
    *   Haz clic en **Auto-llave** en la barra lateral para instalar la clave `key_retail.bin`.
    *   Pasa a la pestaña **Catálogo Online**, selecciona tus series favoritas y pulsa **Instalar Serie** o **Instalar Selección**.
5.  ¡Listo para usar en tu consola Nintendo Switch, Wii U o 3DS!

---

## ☕ Apoyar el Proyecto

Desarrollado con ♥ por **AO Labs Chile** (<a href="https://aolabs.cl/" target="_blank" rel="noopener noreferrer">https://aolabs.cl/</a>). Si este proyecto te ha sido de ayuda y deseas apoyar su desarrollo, mejoras continuas y mantenimiento, ¡puedes invitarnos a un café!:

👉 <a href="https://ko-fi.com/aolabs" target="_blank" rel="noopener noreferrer"><strong>https://ko-fi.com/aolabs</strong></a>

---

# English

A modern, intuitive, and responsive web manager designed to administer Amiibo files on **Allmiibo** / **Pixl.js** devices via **Web Bluetooth (Web BLE)**. It allows seamless wireless file transfers, automatic folder categorization, OTA DFU firmware updates, and automatic encryption key setup directly from your browser without cables or extra software.

👉 **Direct Web App Link**: <a href="https://allmiibo.aolabs.cl/" target="_blank" rel="noopener noreferrer">https://allmiibo.aolabs.cl/</a>  
🐙 **GitHub Repository**: <a href="https://github.com/AO-Labs-Chile/allmiibo-manager" target="_blank" rel="noopener noreferrer">https://github.com/AO-Labs-Chile/allmiibo-manager</a>

> [!IMPORTANT]
> **Compatibility**: Web Bluetooth works natively in Chromium-based browsers (Google Chrome, Microsoft Edge, Opera, or Brave). On iOS devices (iPhone/iPad), you must open the web app inside the free **Bluefy (Web BLE Browser)** app from the App Store. On Android, please ensure both Bluetooth and Location (GPS) are enabled.

---

## 🚀 Key Features

*   **Integrated Online Vault (Internet Archive)**: Browse hundreds of Amiibos organized by franchise and subseries (e.g., *Animal Crossing: Series 1-5, Sanrio, Amiibo Festival*, *The Legend of Zelda*, *Splatoon*, *Super Smash Bros*, etc.) with official artwork.
*   **Direct Wireless Flashing**: Install Amiibos straight from the online catalog to your Allmiibo in the background with 1-click.
*   **Smart Folder Categorization**: When installing full series, the system automatically creates hardware-compliant root subfolders (`Zelda_BotW`, `Zelda_TotK`, `AC_Series_1`, etc.) respecting LittleFS path limits.
*   **Safe Device Wipe**: Dedicated erase button that cleans Amiibos while permanently preserving `key_retail.bin` and your save files (`E:/amiibo/save`).
*   **One-Click Key Auto-Updater (`key_retail.bin`)**: Downloads the official 160-byte decryption key directly from the Internet Archive vault and installs it to the root of your Allmiibo.
*   **Wireless DFU Reboot (Firmware Updater)**: Send a direct Bluetooth command to reboot the Allmiibo into *Device Firmware Update (DFU)* mode automatically.
*   **Local Explorer & Visual Gallery**: Browse installed Amiibos in list or visual grid mode with official artwork retrieved dynamically via <a href="https://www.amiiboapi.org/" target="_blank" rel="noopener noreferrer">AmiiboAPI</a>.
*   **Modern Responsive Design with Mobile Menu**: Sleek Slate dark theme, high-resolution branding, and a responsive 3-line hamburger menu drawer for mobile devices.
*   **Built-in Virtual Simulator**: Test all UI operations in an in-memory virtual environment without hardware.

---

## 🛠️ How to Use

1.  Open the web application at <a href="https://allmiibo.aolabs.cl/" target="_blank" rel="noopener noreferrer">https://allmiibo.aolabs.cl/</a>.
2.  Click **Conectar Allmiibo** (ensure Bluetooth is enabled on your device).
3.  Select your Allmiibo device from the browser pairing popup.
4.  If configuring for the first time:
    *   Click **Auto-llave** on the sidebar to install `key_retail.bin`.
    *   Navigate to the **Catálogo Online** tab, filter your desired series, and click **Instalar Serie** or **Instalar Selección**.
5.  Ready to tap and scan on your Nintendo Switch, Wii U, or 3DS!

---

## ☕ Support the Project

Developed with ♥ by **AO Labs Chile** (<a href="https://aolabs.cl/" target="_blank" rel="noopener noreferrer">https://aolabs.cl/</a>). If you find this project useful and want to support its ongoing development, feel free to buy us a coffee:

👉 <a href="https://ko-fi.com/aolabs" target="_blank" rel="noopener noreferrer"><strong>https://ko-fi.com/aolabs</strong></a>
