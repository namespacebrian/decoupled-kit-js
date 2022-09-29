import { render } from '@testing-library/react';
import PaginationExampleTemplate from '../../pages/examples/pagination/[[...page]]';

import examplePaginationData from '../data/examplePaginationData.json';
import umamiFooterMenu from '../data/umamiMenuItemsMainData.json';
import defaultProfileFooterMenu from '../data/defaultProfileMenuItemsMainData.json';

vi.mock('next/router', () => ({
	useRouter: () => ({
		locale: 'en',
		pathname: 'test/path',
		push: vi.fn(),
		query: {
			page: '/examples/pagination/[[...page]]',
		},
	}),
}));
/**
 * @vitest-environment jsdom
 */

describe(`${PROFILE} <PaginationExampleTemplate />`, () => {
	const footerMenu =
		PROFILE === 'umami' ? umamiFooterMenu : defaultProfileFooterMenu;
	it('should render the Pagination Example page', () => {
		const { asFragment } = render(
			<PaginationExampleTemplate
				footerMenu={footerMenu}
				data={examplePaginationData}
			/>,
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
