window.app = Vue.createApp({
    data() {
        return {
            animePair: [],
            loading: true,
            highScore: 0,
            streak: 0
        }
    },
    mounted() {
        this.getTwoAnime()
        this.highScore = Number(localStorage.getItem('highScore')) || 0
    },
    methods: {
        guessOverUnder(guess, other) {
            guess.score >= other.score ? this.streak++ : this.streak = 0
            this.streak > Number(localStorage.getItem('highScore')) ? localStorage.setItem('highScore', this.streak) : null
            this.animePair = [] // clears the options after a guess has been made
            this.getTwoAnime()
        },
        async getRandomAnime() {
            this.loading = true

            try {
                const res = await fetch('https://api.jikan.moe/v4/random/anime')
                const json = await res.json()
                return json.data
            }
            catch(err) {
                console.error("Jikan API error: ", err)
            }

            this.loading = false
        },
        async getRandomAnimeFiltered(maxRetries = 5) {
            for (i=0; i < maxRetries; i++) {
                const candidates = await Promise.all([
                    this.getRandomAnime(),
                    this.getRandomAnime(),
                    this.getRandomAnime()
                ])

                const anime = candidates.find(a => a.scored_by >= 10000 && a.score != null)
                if (anime && anime.score != null) return anime
            }
            return await this.getRandomAnime()
        },
        async getTwoAnime() {
            this.loading = true

            const [first, second] = await Promise.all([
                this.getRandomAnimeFiltered(),
                this.getRandomAnimeFiltered()
            ])

            if (second.mal_id === first.mal_id) {
                const retry = await this.getRandomAnimeFiltered()
                this.animePair = [first, retry]
            } else {
                this.animePair = [first, second]
            }

            this.loading = false
        }
    }
}).mount('#app')