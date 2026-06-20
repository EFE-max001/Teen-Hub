import DashboardPage from '@/components/dashboard/index'
import { GetServerSideProps } from 'next'
import { requireAuth } from '@/lib/middleware'

export default DashboardPage

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = await requireAuth(context, 'GUEST')
  if (redirect) return redirect
  return { props: {} }
}
