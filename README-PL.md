# Carillon 1.0 — projekt Windows

## Własna próbka
1. Otwórz folder `public`.
2. Skopiuj tam swoją próbkę i nazwij ją dokładnie `sample.wav`.
3. Wgraj cały projekt do GitHub i uruchom workflow budujący Windows.

Aplikacja ładuje tę próbkę po kliknięciu **GRAJ** i pokazuje pasek postępu. Nie ma funkcji wgrywania próbki z poziomu programu.

## MIDI
Po uruchomieniu instrumentu przejdź do Ustawienia → Połącz / odśwież MIDI. Klawiatura ekranowa zaczyna się od środkowego C4 (MIDI 60). Wszystkie numery nut MIDI są mapowane chromatycznie względem próbki C3 (MIDI 48), więc kontroler może grać nutami z całego zakresu MIDI. Web MIDI może nie być dostępne w WebView Tauri na każdym komputerze; w takim przypadku konieczna będzie natywna integracja MIDI.

## Nagrywanie
Po puszczeniu klawisza dźwięk próbki wybrzmiewa do naturalnego końca; puszczenie klawisza nie ucina próbki. Początkowa cisza krótsza niż 120 ms jest automatycznie usuwana, aby zmniejszyć odczuwalne opóźnienie. Nagrywanie przechwytuje wyjście audio silnika Carillon (bez mikrofonu). Nagrania są tymczasowe i przechowywane w pamięci bieżącej sesji.

## Budowanie
`npm install`, `npm run tauri:build`
