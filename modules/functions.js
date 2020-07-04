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

const fDateHuman = (date = new Date()) => {
	const year = date.getFullYear()
	const month = fDateUnit(date.getMonth() + 1)
	const monthDay = fDateUnit(date.getDate())
	const hours = fDateUnit(date.getHours())
	const minutes = fDateUnit(date.getMinutes())
	const seconds = fDateUnit(date.getSeconds())

	return `${monthDay}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

function dateH() {
	const date = new Date();
	const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
	return fDateHuman(new Date(utc + (3600000 * (-3))));
}

module.exports = {
	fDateFromInput,
	fDate,
	dateH
}