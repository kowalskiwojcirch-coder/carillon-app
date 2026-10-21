# Carillon — projekt Windows 10/11

Projekt zawiera aplikację Tauri 2 oraz interfejs Carillon.

## Co działa w prototypie
- Interfejs z zakładkami Carillon, Ustawienia, Nagrania i Informacje.
- Import własnej próbki C3 (MP3/WAV).
- Klawiatura ekranowa i skróty klawiaturowe.
- Odtwarzanie wysokości z algorytmem granularnym, który ma zachowywać w przybliżeniu długość próbki.
- Obsługa wejścia MIDI przez Web MIDI, jeśli środowisko WebView ją udostępnia.
- Nagrywanie wyjścia audio, odsłuch, eksport i usuwanie nagrań.
- Zapamiętywanie zgody i głośności lokalnie.
- Workflow GitHub Actions do budowania instalatora Windows.

## Budowanie instalatora bez obciążania własnego komputera
1. Utwórz repozytorium GitHub i wgraj wszystkie pliki tego projektu do głównego katalogu repozytorium.
2. Otwórz zakładkę **Actions** w repozytorium.
3. Wybierz **Build Carillon for Windows**, następnie **Run workflow**.
4. Po zakończeniu otwórz uruchomione zadanie i pobierz artefakt `Carillon-Windows-Installer`.
5. W środku będzie instalator `.exe` (oraz MSI, jeśli kompilacja go utworzy).

Do kompilacji potrzebne jest konto GitHub. Twojego komputera nie obciążamy instalacją Rusta ani narzędzi C++.

## Testowanie interfejsu
Możesz otworzyć `index.html` w przeglądarce, ale funkcje audio/MIDI najlepiej testować w aplikacji Tauri. Aby uruchomić tryb deweloperski lokalnie, potrzebne są Node.js, Rust i narzędzia C++ — nie instaluj ich, jeśli masz mało miejsca.

## Ważne ograniczenia wersji 0.1.0
- Próbka `C3.mp3` nie jest dołączona; należy wybrać ją w aplikacji.
- Przesunięcie wysokości bez zmiany długości realizuje prosty algorytm granularny. To prototyp i może powodować artefakty, szczególnie przy dużych odległościach od C3.
- Nagrania są przechowywane w lokalnym magazynie przeglądarkowym. Przy bardzo długich nagraniach może zabraknąć miejsca; pobieraj je regularnie.
- Web MIDI zależy od możliwości WebView2 i dostępnych sterowników MIDI. Jeśli MIDI nie działa w WebView2, potrzebna będzie natywna integracja MIDI w kolejnej wersji.
- Do produkcyjnego wydania dodaj własną ikonę Windows w `src-tauri/icons/` i skonfiguruj ją w Tauri.
- Nie używaj programu do przechowywania jedynych kopii ważnych nagrań; eksportuj je do plików.

## Struktura
- `index.html` — układ aplikacji.
- `src/style.css` — wygląd i styl, niezależny od logiki.
- `src/main.js` — dźwięk, klawiatura, MIDI i nagrywanie.
- `src-tauri/` — konfiguracja natywnego okna Windows.
- `.github/workflows/build-windows.yml` — budowanie instalatora w chmurze.
