import { useEffect, useState } from "react"
import useAnswers from "./useAnswers"
import useKeyColours from "./useKeyColours"

const useKeyHandler = () => {

    useEffect(() => {
        document.addEventListener("keydown", keyDownEventHandler)
        return () => document.removeEventListener("keydown", keyDownEventHandler)
    })

    useEffect(() => {
        document.addEventListener("keyup", keyUpEventHandler)
        return () => document.removeEventListener("keyup", keyUpEventHandler)
    })

    const getLocalStorageOrDefault = (key: string, defaultResult: any) => {
        var result = localStorage.getItem(key)
        return result ? JSON.parse(result) : defaultResult
    }

    const [guesses, setGuesses] = useState<string[]>(getLocalStorageOrDefault("guesses", Array(6).fill("")))
    const [colours, setColours] = useState<string[][]>(getLocalStorageOrDefault("colours", Array(6).fill(Array(5).fill(""))))
    const [jiggle, setJiggle] = useState(false)

    const [currentRow, setCurrentRow] = useState(0)
    const {getColoursForGuess, isGuessValid, nextAnswer} = useAnswers()
    const {setKeyColour, getKeyClasses, setActiveKey, resetKeyColours} = useKeyColours()

    useEffect(() => {
        if (jiggle) {
            setTimeout(() => setJiggle(false), 500)
        }
    }, [jiggle])

    useEffect(() => {
        if (guesses[0] === "") {
            return
        }
        const row = guesses.findIndex(guess => guess === "")
        setCurrentRow(row === -1 ? 6 : row)
        guesses.forEach((guess, guessIndex) => {
            if (guess === "") {
                return
            }
            guess.split("").forEach((letter, letterIndex) => setKeyColour(letter, colours[guessIndex][letterIndex]))
        })
    }, [])

    const enterKeyHandler = () => {
        if (currentRow > 5 || guesses[currentRow].length < 5 || !isGuessValid(guesses[currentRow])) {
            setJiggle(true)
            return
        }

        const coloursForGuess = getColoursForGuess(guesses[currentRow])

        setColours(prev => {
            const result = prev.map(row => row.slice())
            result[currentRow] = coloursForGuess
            localStorage.setItem("colours", JSON.stringify(result))
            return result
        })

        guesses[currentRow].split("").forEach((letter, index) => setKeyColour(letter, coloursForGuess[index]))

        setCurrentRow(prev => prev + 1)
        localStorage.setItem("guesses", JSON.stringify(guesses))
    }

    const backspaceKeyHandler = () => {
        if (guesses[currentRow].length === 0) {
            return
        }

        setGuesses(prev => {
            const result = [...prev]
            result[currentRow] = result[currentRow].slice(0, -1)
            return result
        })
    }

    const letterKeyHandler = (key: string) => {
        key = key.toUpperCase()
        if (!key.match(`^[A-Z]$`) || guesses[currentRow].length > 4 || (currentRow > 1 && colours[currentRow - 1].every(colour => colour === 'green'))) {
            return
        }

        setGuesses(prev => {
            const result = [...prev]
            result[currentRow] += key
            return result
        })
    }
    
    const keyHandler = (key: string) => {
        switch(key) {
            case "↵": enterKeyHandler(); return
            case "⌫": backspaceKeyHandler(); return
            default: letterKeyHandler(key)
        }
    }

    const keyDownEventHandler = (event: KeyboardEvent) => {
        if (event.metaKey || event.ctrlKey) {
            return
        }

        let {key} = event
        switch (key) {
            case "Enter": key = "↵"; break
            case "Backspace": key = "⌫"
        }

        key = key.toUpperCase()
        setActiveKey(key)
        keyHandler(key)
    }

    const keyUpEventHandler = () => setActiveKey('')

    const shouldJiggle = (row: number) => jiggle && row === currentRow

    const startNewGame = () => {
        setGuesses(Array(6).fill(""))
        setColours(Array(6).fill(Array(5).fill("")))
        setCurrentRow(0)
        nextAnswer()
        resetKeyColours()
    }

    const shouldShowModal = () => (currentRow > 0) && colours[currentRow - 1].every(colour => colour === "green") || currentRow > 5

    return {guesses, colours, shouldShowModal, shouldJiggle, keyHandler, getKeyClasses, startNewGame}
}

export default useKeyHandler