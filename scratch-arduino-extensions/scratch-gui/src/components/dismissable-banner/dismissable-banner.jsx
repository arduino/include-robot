import {injectIntl} from 'react-intl';
import React from 'react';

import styles from './dismissable-banner.css';
import classNames from 'classnames';

class DismissableBannerContent extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isShowing: false
        };
    }
    setShow () {
        // needed to set the opacity to 1, since the default is .9 on show
        this.setState({isShowing: true});
    }
    setHide () {
        this.setState({isShowing: false});
    }

    render () {
        return (
            <div className={classNames(styles.alert, styles.success)}>
                <input
                    type="checkbox"
                    id="alert1"
                />
                <label
                    className={styles.close}
                    title="close"
                    htmlFor="alert1"
                >
                    <i className={styles.iconRemove} />
                </label>
                <p className={styles.inner}>
                    <strong>{'Warning! '}</strong>
                    {'This is not an Arduino product, it’s just an experimental tool'}
                </p>
            </div>

        );
    }
}

const DismissableBanner = injectIntl(DismissableBannerContent);

export {
    DismissableBanner
};
