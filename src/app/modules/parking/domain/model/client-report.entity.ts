/*
  ClientReport is the domain entity for a problem report submitted by a
  client after a parking session.

  When the user clicks "Report" on a history card and confirms:
    1. HistoryStore creates a ClientReport
    2. HistoryApi sends it via POST /clientReports
    3. json-server assigns the final id and persists the record

  The initial id is an empty string '' — json-server overwrites it with
  a real id on creation. This is the same pattern used for any POST
  where the server assigns the id.

  It implements BaseEntity so ClientReportsApiEndpoint (extends
  BaseApiEndpoint) can use it as a typed entity, enabling .create().
*/
import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export type ReportType = 'safety-concern' | 'maintenance-issue' | 'billing-dispute' | 'other';

export class ClientReport implements BaseEntity {
  constructor(
    public readonly id: string,             // '' on creation, assigned by server
    public readonly clientId: string,
    public readonly parkingId: string,
    public readonly reservationId: string,
    public readonly type: ReportType,
    public readonly date: string,           // ISO date string (YYYY-MM-DD)
    public readonly status: string,         // always 'submitted' on creation
  ) {}
}
