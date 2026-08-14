# Allmiibo Web Manager (Gestor Web Allmiibo)

[**Español**](#español) | [**English**](#english)

---

# Español

Un gestor web moderno, intuitivo y responsivo para administrar archivos Amiibo en dispositivos **Allmiibo** / **Pixl.js** a través de **Web Bluetooth (Web BLE)**. Permite la transferencia, organización y actualización de claves de cifrado directamente desde tu navegador sin instalar aplicaciones adicionales.

> [!IMPORTANT]
> **Compatibilidad**: Web Bluetooth requiere un navegador basado en Chromium (Google Chrome, Microsoft Edge, Opera o Brave). Para iOS (iPhone/iPad), debes abrir la página dentro de un navegador Web BLE dedicado como **Bluefy**.

## 🚀 Características Principales

*   **Catálogo Online Integrado**: Explora más de 900 Amiibos, filtra por series o busca personajes concretos. Las imágenes se cargan dinámicamente usando [AmiiboAPI](https://www.amiiboapi.org/).
*   **Flasheo Directo sin Descargas**: Instala los Amiibos directamente desde el catálogo online al Allmiibo en segundo plano (los descarga y envía directamente, sin llenar tu disco duro).
*   **Galería Visual del Dispositivo**: Una pestaña local que lee de forma recursiva los archivos `.bin` y `.nfc` instalados en el Allmiibo y los muestra visualmente con sus portadas oficiales.
*   **Instalación por Lotes (Series)**: Instala una serie completa filtrada (p. ej. *Zelda* o *Splatoon*) con un solo botón, sugiriendo de forma automática una carpeta organizada.
*   **Sanitización Automática de Nombres**: Modifica caracteres especiales (tildes, `ñ`, no-ASCII) y acorta las rutas de archivos sobre la marcha para respetar el estricto límite de hardware de 63 bytes por ruta del Allmiibo.
*   **Auto-actualización de Claves (`key_retail.bin`)**: Descarga e instala de forma automática la clave criptográfica de 160 bytes uniendo componentes de repositorios públicos comunitarios, activando la base de datos interna con un clic.
*   **Simulador Integrado**: Si no tienes un Allmiibo a mano, puedes probar todas las funciones (subida, borrado, renombrado) con un dispositivo simulado en memoria.
*   **FAQ / Ayuda Interactiva**: Sección que explica cada opción en pantalla (Emulador, Base de datos, Amiibolink, RFID, Bluetooth).

## 🛠️ Cómo Utilizar

1.  Abre la aplicación web pública hospedada en GitHub Pages.
2.  Haz clic en **Conectar Allmiibo** (asegúrate de que tu dispositivo tiene activada la opción Bluetooth en su menú).
3.  Selecciona tu Allmiibo en la ventana del navegador.
4.  ¡Empieza a gestionar!

---

# English

A modern, intuitive, and responsive web manager to administer Amiibo files on **Allmiibo** / **Pixl.js** devices via **Web Bluetooth (Web BLE)**. It enables direct file transfers, organization, and encryption key updates right from your browser with no software installation required.

> [!IMPORTANT]
> **Compatibility**: Web Bluetooth requires a Chromium-based browser (Google Chrome, Microsoft Edge, Opera, or Brave). For iOS (iPhone/iPad), you must open the page inside a dedicated Web BLE browser such as **Bluefy**.

## 🚀 Key Features

*   **Integrated Online Catalogue**: Browse over 900 Amiibos, filter by series, or search specific characters. Cover art is dynamically fetched using [AmiiboAPI](https://www.amiiboapi.org/).
*   **Direct Flash (No Local Downloads)**: Install Amiibos straight from the online catalogue to your Allmiibo in the background (files are downloaded and sent on the fly).
*   **Visual Local Gallery**: A dedicated tab that recursively scans the `.bin` and `.nfc` files installed on your Allmiibo and displays them in a grid with their official covers.
*   **Batch Install (Series)**: Install an entire filtered series (e.g., *Zelda* or *Splatoon*) at once, automatically proposing an organized destination folder.
*   **Auto-Sanitization of Names**: Automatically strips accents, special characters, and shortens file paths on the fly to respect the strict 63-byte path hardware limit of the Allmiibo.
*   **Encryption Key Auto-Updater (`key_retail.bin`)**: Downloads and merges parts from public mirrors to automatically build and upload the 160-byte decryption key, enabling the device's internal database instantly.
*   **Built-in Simulator**: Test file uploads, renaming, deleting, and catalogue flashing without a physical device using an in-memory virtual emulator.
*   **Interactive Help & FAQ**: Quick-access guide explaining device options (Emulator, Database, Amiibolink, RFID, Bluetooth).

## 🛠️ How to Use

1.  Open the public web application hosted on GitHub Pages.
2.  Click **Conectar Allmiibo** (ensure Bluetooth is enabled in your device's settings menu).
3.  Select your Allmiibo device from the browser popup.
4.  Start managing your files!
