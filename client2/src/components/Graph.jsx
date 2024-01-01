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
import { ethers } from 'ethers'
import { Line } from 'react-chartjs-2'
import { useState } from 'react'

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
      // x[formattedDateTime] = x[formattedDateTime] ? x[formattedDateTime].push(price.price) : [price.price]
      if (x[formattedDateTime]) {
          x[formattedDateTime].push(price.price)
      } else {
          x[formattedDateTime] = [price.price]
      }
      return x
  }, {})
  const labels = Object.keys(objData)
  
  labels.forEach((label) => {
      const arr = objData[label]
      const sum = arr.reduce((x, i) => {
          const val = i / Math.pow(10, 36)
          return val + x
      }, 0)

      const avg =(sum / arr.length)
      objData[label] = avg
  })
  const dataSet = {
      labels, 
      datasets:[
          {
              label: 'Dataset 1',
              data: labels.map((label) => objData[label]),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
      ]
      
  }
  return<Line options={options} data={dataSet} />
}

export default Graph
