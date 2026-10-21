# Carillon — projekt aplikacji Windows

To jest projekt źródłowy do zbudowania aplikacji Windows przez GitHub Actions. **To jeszcze nie jest gotowy plik EXE.**

## Jak wgrać pliki, także ukryty folder `.github`

1. Pobierz ZIP projektu i rozpakuj go na komputerze.
2. Otwórz folder `carillon-windows-project`.
3. W repozytorium GitHub wybierz **Add file → Upload files**.
4. Otwórz rozpakowany folder i zaznacz jego zawartość. Najważniejsze: upewnij się, że wgrywasz też `.github/workflows/build-windows.yml`.
5. Jeśli `.github` jest niewidoczny w oknie wybierania plików Windows, w Eksploratorze plików wybierz **Widok → Pokaż → Ukryte elementy** (w niektórych wersjach: Widok → Opcje → Widok → Pokaż ukryte pliki, foldery i dyski).
6. Łatwiejsza metoda: w folderze projektu utwórz plik `SHOW-HIDDEN-FOLDER-INSTRUCTIONS.txt` jeśli potrzebujesz, ale nie zmieniaj nazwy `.github`. GitHub musi dostać folder dokładnie pod nazwą `.github`.
7. Kliknij **Commit changes**.

## Jeśli przesyłanie przez przeglądarkę pomija `.github`

Nie próbuj przesyłać samego pliku ZIP — GitHub nie rozpakowuje ZIP-a podczas przesyłania plików do repozytorium. Najpewniejsza metoda bez instalowania programów to w repozytorium utworzyć ręcznie plik:
`.github/workflows/build-windows.yml`
i wkleić zawartość tego pliku z ZIP-a. Na GitHubie w widoku Code kliknij Add file → Create new file i w polu nazwy wpisz całą ścieżkę `.github/workflows/build-windows.yml`. Wklej zawartość, następnie Commit changes.

## Uruchomienie budowania

1. Otwórz zakładkę **Actions**.
2. Wybierz **Build Carillon for Windows**.
3. Kliknij **Run workflow** → **Run workflow**.
4. Po zakończeniu otwórz zakończone uruchomienie i pobierz artefakt `Carillon-Windows-Installer`.
5. Rozpakuj artefakt. Powinien zawierać instalator `.exe` lub `.msi`, jeśli budowanie zakończy się sukcesem.

## Ważne ograniczenia prototypu

- Nie zawiera pliku `C3.mp3`; wczytaj go w aplikacji po uruchomieniu.
- Zmiana wysokości dźwięku jest w tej wersji prototypowa i korzysta ze zmiany częstotliwości odtwarzania, więc zmienia też długość dźwięku. To nie spełnia jeszcze wymogu wysokiej jakości transpozycji bez zmiany czasu.
- MIDI zależy od obsługi przez środowisko aplikacji i może wymagać natywnej integracji.
- Długie nagrania mogą przekroczyć limit pamięci przeglądarkowej.
- Przed publiczną publikacją wymagane są testy i dopracowanie.

## Pliki

- `package.json` — zależności i komendy.
- `index.html`, `src/` — interfejs.
- `src-tauri/` — konfiguracja aplikacji Windows.
- `.github/workflows/build-windows.yml` — automatyczne budowanie instalatora.
