import { createContext, useContext, useState } from 'react'

const context = createContext()

export const ContextProvider = ({ children }) => {
    const [val, setVal] = useState(10)
    const [state, setState] = useState({
        provider: null,
        signer: null,
        contract: null,
    })
    
    return (
        <context.Provider value={{ val, setVal, state, setState }}>{children}</context.Provider>
    )
}

export const useCustomContext = () => useContext(context)

