import gql from 'graphql-tag'

export const createSchedule = gql`
mutation createSchedule($schedule: ScheduleCreateInput!) {
    createSchedule(schedule: $schedule) {
        subject
        startTime
        endTime
        timeZone
        issueId
        meetingLink
    }
  }
`

export const getSchedule = gql`
  query getSchedule($issueId: Int!) {
    getSchedule(issueId: $issueId) {
        subject
        startTime
        endTime
        timeZone
        issueId
    }
  }
`

export const getIssueSchedules = gql`
  query getIssueSchedules ($issueId: Int!) {
    getIssueSchedules(issueId: $issueId) {
      subject
      startTime
      endTime
      timeZone
    }
  }
`