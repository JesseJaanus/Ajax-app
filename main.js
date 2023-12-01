document.addEventListener('DOMContentLoaded', function () {

    // Haetaan HTML-elementit
    const theaterSelect = document.getElementById('theaterSelect');
    const movieInfo = document.getElementById('movieInfo');
    const omdbApiKey = '4eaea3cb';

    // Haetaan elokuvateatterialueiden tiedot ja lisätään ne alasveto-valikkoon, dropdown-valikkoon jatkossa
    fetch('https://www.finnkino.fi/xml/TheatreAreas/')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, 'text/xml');
            const theaters = xmlDoc.getElementsByTagName('TheatreArea');

            // Lisätään jokainen elokuvateatteri sekä kaupunki dropdown-valikkoon
            for (let i = 0; i < theaters.length; i++) {
                const option = document.createElement('option');
                option.value = theaters[i].getElementsByTagName('ID')[0].childNodes[0].nodeValue;
                option.textContent = theaters[i].getElementsByTagName('Name')[0].childNodes[0].nodeValue;
                theaterSelect.appendChild(option);
            }
        });

    // Lisätään tapahtumankäsittelijä dropdown-valikon tapahtumiin
    theaterSelect.addEventListener('change', function () {
        const selectedTheaterId = theaterSelect.value;

        // Haetaan valitun elokuvateatterin ohjelmisto
        fetch(`https://www.finnkino.fi/xml/Schedule/?area=${selectedTheaterId}`)
            .then(response => response.text())
            .then(data => {
                näytäTiedot(data);
            });
    });

    // Funktio, joka näyttää elokuvien ja tapahtumien tiedot sivulla
    function näytäTiedot(data) {
        movieInfo.innerHTML = '';

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        const elementit = xmlDoc.getElementsByTagName('Show');

        // Käydään läpi jokainen elokuvataphtuma ja näytetään niiden tiedot
        for (let i = 0; i < elementit.length; i++) {
            const div = document.createElement('div');
            div.classList.add('tiedot');

            // Luodaan otsikko elementille
            const nimi = document.createElement('h3');
            nimi.textContent = elementit[i].getElementsByTagName('Title')[0].childNodes[0].nodeValue;

            // Luodaan elementti esitysajoille ja näytetään se
            const aikataulu = document.createElement('p');
            aikataulu.textContent = `Aika: ${näytäAikataulu(elementit[i])}`;

            // Lisätään OMDB API:n tarvitseva EventID-attribuutti
            const imdbID = elementit[i].getElementsByTagName('EventID')[0].childNodes[0].nodeValue;
            div.setAttribute('data-imdb-id', imdbID);

            // Lisätään elementit diviin
            div.appendChild(nimi);
            div.appendChild(aikataulu);
            movieInfo.appendChild(div);
        }

        // Haetaan kaikki div-elementit
        const tiedotDivs = document.querySelectorAll('.tiedot');
        tiedotDivs.forEach(div => {
            // Haetaan EventID-attribuutista IMDb ID
            const imdbID = div.getAttribute('data-imdb-id');

            // Haetaan tiedot OMDB API:sta
            fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${omdbApiKey}`)
                .then(response => response.json())
                .then(data => {
                    // Tarkistetaan onko elokuvalla kuvaa ja näytetään se tai lisätään virheteksti
                    if (data.Poster && data.Poster !== 'N/A') {
                        const kuva = document.createElement('img');
                        kuva.src = data.Poster;
                        div.appendChild(kuva);
                    } else {
                        const placeholderTeksti = document.createElement('p');
                        placeholderTeksti.textContent = 'Kuva ei saatavilla';
                        div.appendChild(placeholderTeksti);
                    }
                })
                .catch(error => {
                    console.error('Virhe tietojen hakemisessa OMDB API:sta:', error);
                    const errorText = document.createElement('p');
                    errorText.textContent = 'Virhe kuvaa haettaessa';
                    div.appendChild(errorText);
                });
        });
    }

    // Funktion määrittely, joka muotoilee esitysajat haluttuun muotoon
    function näytäAikataulu(elementti) {
        const aikataulut = elementti.getElementsByTagName('dttmShowStart');
        const ajat = [];

        // Käydään läpi aikataulut ja muotoillaan ne 
        for (let i = 0; i < aikataulut.length; i++) {
            const aika = new Date(aikataulut[i].childNodes[0].nodeValue);

            // Lisätään kaksi nollaa tunneille ja minuuteille
            const tunti = aika.getHours().toString().padStart(2, '0');
            const minuutti = aika.getMinutes().toString().padStart(2, '0');

            const muotoiltuAika = `${aika.getDate()}.${aika.getMonth() + 1}.${aika.getFullYear()} ${tunti}:${minuutti}`;
            ajat.push(muotoiltuAika);
        }

        // Palautetaan aikataulut merkkijonona
        return ajat.join(', ');
    }
});
