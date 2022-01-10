import schedule from 'node-schedule'

export default async () => {
  const rule = new schedule.RecurrenceRule()

  rule.second = [10,20,30,40,50]

  schedule.scheduleJob(rule, async () => {
  })
}
