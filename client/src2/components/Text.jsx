import React from 'react'
import { useCustomContext } from '../ContextProvider'

const Text = ({ text }) => {
    const { val } = useCustomContext()
    return (
        <div>
            {text}: {val}
        </div>
    )
}

export default Text
