window.app = Vue.createApp({
    data() {
        return {
            animePair: [],
            loading: true,
            highScore: 0,
            streak: 0,
            hint: false,
            guessed: false,
            lastRequestTime: 0
        }
    },
    mounted() {
        this.getTwoAnime()
        this.highScore = Number(localStorage.getItem('highScore')) || 0
    },
    methods: {
        async rateLimitedFetch(url) {
            const now = Date.now()
            const diff = now - this.lastRequestTime

            const minDelay = 3000

            if (diff < minDelay) {
                await new Promise(r => setTimeout(r, minDelay, - diff))
            }

            this.lastRequestTime = Date.now()
            return fetch(url)
        },
        getHint(anime) {
            this.hint = true
        },
        async guessOverUnder(guess, other) {
            this.guessed = true
            if (guess.members >= other.members) this.streak++
            else this.streak = 0
            console.log(guess.title)
            console.log(other.title)
            if (this.streak > Number(localStorage.getItem('highScore'))) {
                localStorage.setItem('highScore', this.streak)
                this.highScore = this.streak
            }
            await new Promise(res => setTimeout(res, 1200)) // the amount of seconds it waits for the DOM to update before running getTwoAnime
            await this.getTwoAnime()
            this.hint = false
            this.guessed = false
        },
        async getRandomAnime() {
            try {
                const res = await this.rateLimitedFetch('https://api.jikan.moe/v4/random/anime')
                const json = await res.json()
                return json.data
            }
            catch(err) {
                console.error("Jikan API error: ", err)
            }
        },
        async getRandomAnimeFiltered(maxRetries = 15) {
            for (let i=0; i < maxRetries; i++) {
                const anime = await this.getRandomAnime()
                console.log(`Fetched ${anime.title_english || anime.title}`)
                if (anime && anime.scored_by >= 10000 && anime.score != null) return anime
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
