import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Chart.js Line Chart',
        },
    },
}

function Graph({ futureAssetPrices }) {
    const objData = futureAssetPrices.reduce((x, price) => {
        const dateObj = new Date(price.timestamp * 1000) // Convert timestamp to milliseconds and create a Date object

        const formattedDateTime = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        })
        console.log('date', formattedDateTime)
        console.log('price.price', price.price)
        console.log('x', x)
        // x[formattedDateTime] = x[formattedDateTime] ? x[formattedDateTime].push(price.price) : [price.price]
        if(x[formattedDateTime]){
            x[formattedDateTime].push(price.price)
        } else {
            x[formattedDateTime] = [price.price]
        }
        console.log('x', x)
        return x
    }, {})
    const labels = Object.keys(objData)
    labels.forEach((label) => {
        const arr = objData.label
        console.log(arr)
    })

    console.log('objData', objData)

    return <p></p>
}

export default Graph
