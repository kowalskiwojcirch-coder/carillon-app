# Carillon 1.0 — projekt Windows

## Własna próbka
1. Otwórz folder `public`.
2. Skopiuj tam swoją próbkę i nazwij ją dokładnie `sample.wav`.
3. Wgraj cały projekt do GitHub i uruchom workflow budujący Windows.

Aplikacja ładuje tę próbkę po kliknięciu **GRAJ** i pokazuje pasek postępu. Nie ma funkcji wgrywania próbki z poziomu programu.

## MIDI
Po uruchomieniu instrumentu przejdź do Ustawienia → Połącz / odśwież MIDI. Wszystkie numery nut MIDI są mapowane chromatycznie względem C3 (MIDI 48). Web MIDI może nie być dostępne w WebView Tauri na każdym komputerze; w takim przypadku konieczna będzie natywna integracja MIDI.

## Nagrywanie
Nagrywanie przechwytuje wyjście audio silnika Carillon (bez mikrofonu). Nagrania są tymczasowe i przechowywane w pamięci bieżącej sesji.

## Budowanie
`npm install`, `npm run tauri:build`
