import { cn } from '../../lib/utils';

const Skeleton = ({ className = '', ...rest }) => (
  <div aria-hidden="true" className={cn('shimmer-bg rounded-lg', className)} {...rest} />
);

export default Skeleton;
