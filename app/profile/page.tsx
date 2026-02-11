import { AuthenticatedGeneralPage } from '../../appPages/AuthenticatedGeneralPage';

export default async function Profile() {
  return (
    <AuthenticatedGeneralPage>
      <div className="text-white">Profile</div>
    </AuthenticatedGeneralPage>
  );
}
