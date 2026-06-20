import ProfilePage from '@/components/dashboard/profile'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'

export default ProfilePage

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = await requireAuth(context, 'GUEST')
  if (redirect) return redirect
  return { props: {} }
}
