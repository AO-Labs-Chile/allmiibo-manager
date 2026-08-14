# Allmiibo Web Manager (Gestor Web Allmiibo)

[**Español**](#español) | [**English**](#english)

---

# Español

Un gestor web moderno, intuitivo y responsivo para administrar archivos Amiibo en dispositivos **Allmiibo** / **Pixl.js** a través de **Web Bluetooth (Web BLE)**. Permite la transferencia inalámbrica de archivos, organización jerárquica de carpetas, actualización de firmware por DFU y descarga automática de claves de cifrado directamente desde el navegador sin instalar aplicaciones adicionales.

> [!IMPORTANT]
> **Compatibilidad**: Web Bluetooth requiere un navegador basado en Chromium (Google Chrome, Microsoft Edge, Opera o Brave). Para dispositivos móviles iOS (iPhone/iPad), debes abrir la aplicación dentro de un navegador Web BLE dedicado como **Bluefy**.

---

## 🚀 Características Principales

*   **Catálogo Online Jerárquico (Internet Archive Vault)**: Explora cientos de Amiibos organizados por franquicias y subseries (ej. *Animal Crossing: Series 1 a 5, Sanrio, Amiibo Festival*, *The Legend of Zelda*, *Splatoon Raiders*, *Super Smash Bros*, etc.) alojados en una bóveda pública segura y duradera.
*   **Flasheo Directo sin Descargas Locales**: Instala Amiibos directamente desde el catálogo online a la memoria de tu Allmiibo en segundo plano, sin ocupar espacio en el disco duro de tu ordenador.
*   **Organización Automática de Subcarpetas**: Al instalar series completas o grupos de tarjetas, el sistema recrea de forma inteligente las subcarpetas en el dispositivo (ej. `E:/amiibo/AC/Cards/Series_1/`), evitando que los archivos queden sueltos o desordenados.
*   **Reinicio Inalámbrico a Modo DFU (Actualizador de Firmware)**: Envía la orden directa por Bluetooth (`0x02`) para reiniciar el Allmiibo en modo *Device Firmware Update (DFU)* de forma automática, sin necesidad de navegar por los menús del aparato.
*   **Detector de Nuevas Versiones de Firmware**: Compara automáticamente la versión de tu Allmiibo con los últimos lanzamientos oficiales de solosky en GitHub, notificándote con una insignia si hay una actualización disponible.
*   **Borrado Seguro de Amiibos con Progreso Visual**: Botón especializado que elimina únicamente los archivos de la carpeta `E:/amiibo`, protegiendo de forma segura la clave `key_retail.bin` y tus partidas guardadas (`E:/save`). Incluye una ventana modal con barra y contador en tiempo real.
*   **Auto-actualización de Claves (`key_retail.bin`)**: Descarga con un solo clic el archivo criptográfico oficial de 160 bytes directamente desde la bóveda de Internet Archive y lo instala en la raíz de tu Allmiibo, habilitando la base de datos interna al instante.
*   **Explorador Local con Conteo de Elementos**: Muestra en tiempo real la cantidad de archivos dentro de cada carpeta (`X elementos`), facilitando la navegación tanto en modo lista como en cuadrícula visual.
*   **Galería Visual del Dispositivo**: Modo de exploración que lee recursivamente los Amiibos instalados en el Allmiibo y los muestra con sus portadas oficiales dinámicas obtenidas a través de [AmiiboAPI](https://www.amiiboapi.org/).
*   **Sanitización Automática de Nombres**: Limpia tildes, caracteres especiales y prefijos innecesarios sobre la marcha, asegurando el cumplimiento estricto del límite de 63 bytes por ruta impuesto por el hardware.
*   **Diseño Centrado y Modo Oscuro Premium**: Interfaz moderna basada en tonos Slate con soporte nativo de `color-scheme: dark` para scrollbars y selectores, optimizada para pantallas ultra-anchas y móviles.
*   **Simulador Integrado**: Permite probar todas las funciones de la interfaz (subida, borrado, navegación) en un entorno virtual sin necesidad de conectar un dispositivo físico.

---

## 🛠️ Guía de Uso

1.  Abre la aplicación web en tu navegador compatible.
2.  Haz clic en **Conectar Allmiibo** (asegúrate de tener el Bluetooth activado en tu dispositivo).
3.  Selecciona tu Allmiibo en la ventana emergente de emparejamiento.
4.  Si es tu primera vez:
    *   Haz clic en **Auto-llave** en la barra lateral para instalar la clave `key_retail.bin`.
    *   Pasa a la pestaña **Catálogo Online**, selecciona tus series favoritas y pulsa **Instalar Selección** o **Instalar Serie**.
5.  ¡Listo para usar en tu consola Nintendo Switch, Wii U o 3DS!

---

# English

A modern, intuitive, and responsive web manager designed to administer Amiibo files on **Allmiibo** / **Pixl.js** devices via **Web Bluetooth (Web BLE)**. It allows seamless wireless file transfers, hierarchical folder organization, OTA DFU firmware updates, and automatic encryption key setup directly from your browser without installing any extra software.

> [!IMPORTANT]
> **Compatibility**: Web Bluetooth requires a Chromium-based browser (Google Chrome, Microsoft Edge, Opera, or Brave). On iOS devices (iPhone/iPad), you must open the page inside a dedicated Web BLE browser like **Bluefy**.

---

## 🚀 Key Features

*   **Hierarchical Online Vault (Internet Archive)**: Browse hundreds of Amiibos organized by franchise and subseries (e.g., *Animal Crossing: Series 1-5, Sanrio, Amiibo Festival*, *The Legend of Zelda*, *Splatoon Raiders*, *Super Smash Bros*, etc.) hosted on a secure, permanent public vault.
*   **Direct Flashing (No Local Downloads)**: Install Amiibos straight from the online catalog to your Allmiibo in the background without cluttering your local drive.
*   **Automated Subfolder Creation**: When installing series or card sets, the manager automatically reproduces the subfolder hierarchy on your device (e.g., `E:/amiibo/AC/Cards/Series_1/`), preventing cluttered root folders.
*   **Wireless DFU Reboot (Firmware Updater)**: Send a direct Bluetooth opcode (`0x02`) to reboot the Allmiibo into *Device Firmware Update (DFU)* mode automatically, without needing to navigate physical device menus.
*   **Firmware Update Notifier**: Compares your connected device version against the latest official solosky GitHub release, highlighting available updates with a badge.
*   **Selective Amiibo Wipe with Visual Progress**: Dedicated delete button that cleans only the `E:/amiibo` directory while preserving `key_retail.bin` and your save files (`E:/save`). Features a real-time progress dialog with item counters.
*   **One-Click Key Auto-Updater (`key_retail.bin`)**: Downloads the official 160-byte decryption key directly from the Internet Archive vault and installs it to the root of your Allmiibo to activate the internal database.
*   **Local Explorer with Item Counts**: Displays asynchronous item counts for directories (`X items`), making storage navigation clear in both list and grid views.
*   **Visual Local Gallery**: Recursively scans Amiibo files stored on your Allmiibo and renders them in a visual card grid with official artwork retrieved via [AmiiboAPI](https://www.amiiboapi.org/).
*   **Automatic Path Sanitization**: Automatically strips accents, bracket prefixes, and illegal characters to strictly adhere to the hardware's 63-byte path length limit.
*   **Centered Layout & Premium Dark Mode**: High-contrast Slate palette with native `color-scheme: dark` integration for scrollbars and inputs, responsive for both ultrawide monitors and mobile screens.
*   **Built-in Virtual Simulator**: Allows testing all UI operations (uploading, erasing, navigating, flashing) in an in-memory virtual environment without hardware.

---

## 🛠️ How to Use

1.  Open the web application in a supported browser.
2.  Click **Conectar Allmiibo** (ensure Bluetooth is enabled on your device).
3.  Select your Allmiibo device from the browser pairing popup.
4.  If configuring for the first time:
    *   Click **Auto-llave** on the sidebar to install `key_retail.bin`.
    *   Navigate to the **Catálogo Online** tab, filter your desired series, and click **Instalar Serie** or **Instalar Selección**.
5.  Ready to tap and scan on your Nintendo Switch, Wii U, or 3DS!
