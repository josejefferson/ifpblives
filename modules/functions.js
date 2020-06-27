const fDateFromInput = date => {
	return date.split('-').reverse().join('/');
}

const fDateUnit = unit => String(unit).length === 1 ? `0${unit}` : unit
const fDate = (date = new Date()) => {
	const year = date.getFullYear()
	const month = fDateUnit(date.getMonth() + 1)
	const monthDay = fDateUnit(date.getDate())
	const hours = fDateUnit(date.getHours())
	const minutes = fDateUnit(date.getMinutes())
	const seconds = fDateUnit(date.getSeconds())

	return `${year}-${month}-${monthDay}_${hours}-${minutes}-${seconds}`
}

module.exports = {
	fDateFromInput,
	fDate
}