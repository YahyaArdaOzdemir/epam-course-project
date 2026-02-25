import { IdeaStatus } from '../../services/contracts';

type IdeaTimelineItem = {
  id: string;
  fromStatus: IdeaStatus | null;
  toStatus: IdeaStatus;
  changedBy: string;
  changedAt: string;
};

type IdeaTimelinePanelProps = {
  items: IdeaTimelineItem[];
};

export const IdeaTimelinePanel = ({ items }: IdeaTimelinePanelProps) => {
  return (
    <section aria-label="Idea timeline">
      <h2>Timeline</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.fromStatus ?? '—'} → {item.toStatus} by {item.changedBy} at {item.changedAt}
          </li>
        ))}
      </ul>
    </section>
  );
};
