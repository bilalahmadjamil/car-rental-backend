import { UserRole, CustomerTier } from '../../../common/enums/user.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  customerTier?: CustomerTier;
}
