'use strict';

var calculateVotes = function calculateVotes (data) {
  data.shift()
  data.pop()

  var totals = data.pop().split(';')
  var headers = data.shift()

  data.shift()

  var response = {
    electoral: {
      hillary: parseInt(totals[17]) || 0,
      trump: parseInt(totals[25]) || 0
    },
    popular: {
      byState: {},
      overall: {
        hillary: parseInt(totals[13]) || 0,
        trump: parseInt(totals[21]) || 0
      }
    }
  }

  data.forEach(function (datum) {
    var splitDatum = datum.split(';')
    var state = splitDatum[0]

    if (!response.popular.byState[state]) {
      response.popular.byState[state] = {
        hillary: 0,
        trump: 0
      }
    }

    response.popular.byState[state].hillary += parseInt(splitDatum[13]) || 0
    response.popular.byState[state].trump += parseInt(splitDatum[21]) || 0
    response.popular.byState[state].total = response.popular.byState[state].hillary + response.popular.byState[state].trump
  })

  return response
}

var commaSeparateNumber = function commaSeparateNumber (number) {
  if (!number) {
    number = 0
  }

  if (typeof number !== 'string') {
    number = number.toString()
  }

  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

var updateHeaderView = function updateHeaderView (data) {
  document.querySelector('section.hillary .electoral-count').innerHTML = commaSeparateNumber(data.electoral.hillary)
  document.querySelector('section.trump .electoral-count').innerHTML = commaSeparateNumber(data.electoral.trump)

  document.querySelector('section.hillary .popular-count').innerHTML = commaSeparateNumber(data.popular.overall.hillary)
  document.querySelector('section.trump .popular-count').innerHTML = commaSeparateNumber(data.popular.overall.trump)
}

var updateStateDemocraticCounts = function updateStateDemocraticCounts (element, data) {
  var currentCount = element.getAttribute('data-hillary')
  var newCount = commaSeparateNumber(data)
  var shouldUpdate = currentCount !== newCount

  if (shouldUpdate) {
    element.setAttribute('data-hillary', newCount)
  }

  return shouldUpdate
}

var updateStateRepublicanCounts = function updateStateRepublicanCounts (element, data) {
  var currentCount = element.getAttribute('data-trump')
  var newCount = commaSeparateNumber(data)
  var shouldUpdate = currentCount !== newCount

  if (shouldUpdate) {
    element.setAttribute('data-trump', newCount)
  }

  return shouldUpdate
}

var updateStateCounts = function updateStateCounts (state, data) {
  var badge
  var list = document.querySelector('ol')
  var stateItem = list.querySelector('#' + state)

  if (!stateItem) {
    badge = document.createElement('div')
    badge.innerHTML = state
    badge.classList.add('state')
    badge.setAttribute('data-hillary', '0')
    badge.setAttribute('data-trump', '0')

    stateItem = document.createElement('li')
    stateItem.setAttribute('id', state)
    stateItem.appendChild(badge)

    list.appendChild(stateItem)
  }

  if (!badge) {
    badge = stateItem.querySelector('.state')
  }

  var updatedDemocraticCount = updateStateDemocraticCounts(badge, data.hillary)
  var updatedRepublicanCount = updateStateRepublicanCounts(badge, data.trump)

  if (updatedDemocraticCount || updatedRepublicanCount) {
    console.groupCollapsed('Updating', state)

    if (updatedDemocraticCount) {
      console.log('Democrats:', data.hillary)
    }

    if (updatedRepublicanCount) {
      console.log('Republicans:', data.trump)
    }

    console.groupEnd()
  }

  if (data.hillary > data.trump) {
    stateItem.classList.add('hillary-is-winning')
    stateItem.classList.remove('trump-is-winning')

  } else if (data.trump > data.hillary) {
    stateItem.classList.add('trump-is-winning')
    stateItem.classList.remove('hillary-is-winning')

  } else {
    stateItem.classList.remove('hillary-is-winning', 'trump-is-winning')
  }
}

var updateView = function updateView (data) {
  var list = document.querySelector('ol')
  var electionData = calculateVotes(data.split('\n'))

  Object.keys(electionData.popular.byState).forEach(function (state) {
    updateStateCounts(state, electionData.popular.byState[state])
  })

  updateHeaderView(electionData)
}

var fetchResults = function fetchResults () {
  var url = 'http://s3.amazonaws.com/origin-east-elections.politico.com/mapdata/2016/LIVE.xml?cachebuster=' + Date.now()

  console.info('[' + (new Date).toISOString() + '] Checking for updates...')
  fetch(url).then(function (response) {
    return response.text();
  })
  .then(updateView)
//  .catch(function (error) {
//    console.warn(error);
//  });
}

fetchResults()

setInterval(fetchResults, 5000)
