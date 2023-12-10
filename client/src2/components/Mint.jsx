import React, { useContext } from 'react'
import { useCustomContext } from '../ContextProvider'

const Mint = () => {
    const {state, setState} = useCustomContext()
    console.log('inside mint')
    console.log(state)
  return (
    <div>Mint</div>
  )
}

export default Mint